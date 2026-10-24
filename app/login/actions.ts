"use server";
import { getJWT, verifyJWT } from "@/lib/authorization";
import {
    CredentialModel,
    getCredentials,
    getCredentialsById,
    getUser,
} from "@/lib/dbActions";
import { AuthenticationResponseJSON } from "@simplewebauthn/browser";
import {
    generateAuthenticationOptions,
    verifyAuthenticationResponse,
    PublicKeyCredentialRequestOptionsJSON,
} from "@simplewebauthn/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function login(username: string | null) {
    const token_cookie = (await cookies()).get("jwt_token")?.value;
    const verifiedToken = await verifyJWT(token_cookie as string);
    if (verifiedToken.auth) redirect("/");
    try {
        if (!username?.trim()) return "Sorry you must enter something";
        const user = await getUser(username);
        if (user.rowCount === 0) {
            return "You must register first";
        }
        console.log("FIRST USER SEARCH FROM DB ANSWER (FOR LOGIN) :", user);

        const passkeys = (await getCredentials(username)).rows;
        console.log(
            "SECOND SAVED CREDENTIALS SEARCH FROM DB ANSWER (FOR LOGIN) I THINK ISSUE IS HERE:",
            passkeys
        );
        passkeys.forEach((passkeyObj) => {
            // [
            //   {
            //     cred_id: 'UNU8l...',
            //     cred_public_key: <Buffer a5 01 a ... 27 more bytes>,
            //     user_id: '6e57...',
            //     webauthn_user_id: '6e57...',
            //     counter: 0,
            //     device_type: 'multiDevice',
            //     backed_up: true,
            //     transports: 'internal,hybrid', --> TRYNA FIX THIS
            //     created_at: 2026-10-19T09:39:52.829Z,
            //     last_used: null,
            //     id: '6e57...',
            //     username: 'tes...',
            //     status: 'COMPLETED'
            //   }
            // ]
            passkeyObj.transports = passkeyObj.transports.split(",");
        });
        console.log(
            "THIRDLY FIXED 2 ISSUES - bad SQL QUERY & JOINING passkey.transports:",
            passkeys // new fixed passkey object/s (dbActions.ts 'createPasskey' needed to join them)
        );
        const options: PublicKeyCredentialRequestOptionsJSON =
            await generateAuthenticationOptions({
                rpID: process.env.rpID as string,
                allowCredentials: passkeys.map((passkey) => ({
                    id: passkey.cred_id,
                    transports: passkey.transports,
                })),
            });
        console.log(
            "FOURTHLY OPTIONS GENERATED FOR USER LOGIN, SENDING THIS BACK: ",
            options
        );
        const cookieStore = await cookies();
        cookieStore.set("login_challenge", options.challenge, {
            maxAge: 3600,
        });

        return options;
    } catch (err) {
        return "Some error occured in finding your saved passkey at our side.";
        console.log(err);
    }
}

export async function verifyAuth(
    username: string,
    resp: AuthenticationResponseJSON
) {
    const cookieStore = await cookies();
    const challenge = cookieStore.get("login_challenge");

    const passkeys = await getCredentialsById(username, resp.id);
    if (passkeys.rowCount === 0) {
        return "Found no passkey for your account, could you please re-register (your account is being deleted BOIIII";
    }
    console.log(
        "FIRSTLY SUCCESSFULLY FOUND THE 1 AND ONLY PASSKEY MATCHED BY ID",
        passkeys.rows[0]
    );
    passkeys.rows[0].transports = passkeys.rows[0].transports.split(",");
    const passkey: CredentialModel = passkeys.rows[0];
    console.log("SECONDLY FIXED THE TRANSPORTS AGAIN: ", passkey);
    try {
        //REMAKING AN ARRAY BUFFER CUS OF TS ERRORS
        const publicKey = new Uint8Array(passkey.cred_public_key);
        const verification = await verifyAuthenticationResponse({
            response: resp,
            expectedChallenge: challenge?.value as string,
            expectedOrigin: process.env.origin as string,
            expectedRPID: process.env.rpID as string,
            credential: {
                id: passkey.cred_id,
                publicKey,
                counter: passkey.counter,
                transports: passkey.transports,
            },
        });
        const token = await getJWT(username);
        console.log("HERE'S THE JWT GNG: ", token);

        cookieStore.set("jwt_token", token, {
            httpOnly: true,
            maxAge: 86400 * 7,
        });
        return verification;
    } catch (err) {
        console.log(err);
        return "Some server-side error happened while verifying your identity.";
    }
}
