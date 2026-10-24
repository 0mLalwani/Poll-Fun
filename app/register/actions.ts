"use server";

import { getJWT, verifyJWT } from "@/lib/authorization";
import {
    changeStatus,
    createPasskey,
    createUser,
    CredentialModel,
    getCredentials,
    getUser,
} from "@/lib/dbActions";
import {
    generateRegistrationOptions,
    RegistrationResponseJSON,
    verifyRegistrationResponse,
    AuthenticatorTransport,
} from "@simplewebauthn/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { DatabaseError } from "pg";

export async function signUp(username: string | null) {
    const cookieStore = await cookies();
    const verifiedToken = await verifyJWT(
        cookieStore.get("jwt_token")?.value as string
    );
    if (verifiedToken.auth) redirect("/");
    try {
        if (!username?.trim()) return "Sorry you must enter something";
        const user = await getUser(username);
        if (user.rowCount === 1) {
            return "You must login instead";
        }
        console.log("FIRST USER SEARCH FROM DB ANSWER :", user);
        const createdUser = await createUser(username);
        if (!createdUser.rowCount) {
            return "Something failed with user creation";
        }
        console.log("SECONDLY USER CREATED IN DB :", createdUser);

        const getUserDetails = (await getUser(username)).rows;
        const passkeys = (await getCredentials(username)).rows;

        const options = await generateRegistrationOptions({
            rpName: process.env.rpName as string,
            rpID: process.env.rpID as string,
            userName: getUserDetails[0].username,
            attestationType: "none",
            excludeCredentials: passkeys.map((p) => ({
                id: p.id,
                // transports: p.transports,
            })),
            authenticatorSelection: {
                residentKey: "preferred",
                userVerification: "preferred",
                // authenticatorAttachment: "platform",
            },
        });
        cookieStore.set("registration_challenge", options.challenge, {
            maxAge: 3600,
        });
        return options;
    } catch (err) {
        console.error(err);
        return "Some error occurred.";
    }
}

export async function getResponse(
    username: string,
    attResp: RegistrationResponseJSON
) {
    const cookieStore = await cookies();
    const challenge = cookieStore.get("registration_challenge")?.value;
    const user_id = (await getUser(username)).rows[0].id;

    try {
        const verified = await verifyRegistrationResponse({
            response: attResp,
            expectedChallenge: challenge as string,
            expectedOrigin: process.env.origin as string,
            expectedRPID: process.env.rpID as string,
        });
        console.log(
            "THIRDLY SUCCESSFULLY VERIFIED THE USER SENT PASSKEY AGAINST CHALLENGE?",
            verified
        );
        if (verified.verified) {
            const newPasskey: CredentialModel = {
                cred_id: verified.registrationInfo.credential.id,
                cred_public_key: verified.registrationInfo.credential.publicKey,
                user_id: (await getUser(username)).rows[0].id,
                webauthn_user_id: user_id,
                counter: verified.registrationInfo.credential.counter,
                device_type: verified.registrationInfo.credentialDeviceType,
                backed_up: verified.registrationInfo.credentialBackedUp,
                transports: verified.registrationInfo.credential
                    .transports as AuthenticatorTransport[],
            };
            const created = await createPasskey(newPasskey);
            console.log("FOURTHLY SUCCESFULLY SAVED CREDS IN DB:", created);
            const statusChanged = await changeStatus("COMPLETED", username);
            console.log(
                "FIFTHLY CHANGED STATUS TO COMPLETED IN DB:",
                statusChanged
            );
        }
        const token = await getJWT(username);
        console.log("HERE'S THE JWT GNG: ", token);

        cookieStore.set("jwt_token", token, {
            httpOnly: true,
            maxAge: 86400 * 7,
        });
        return verified;
    } catch (err) {
        console.log(err);
        if (err instanceof DatabaseError) {
            return "Passkey creation failed";
        }
    }
}
