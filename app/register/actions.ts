"use server"

import {
  createPasskey,
  createUser,
  CredentialModel,
  getCredentials,
  getUser,
} from "@/lib/dbActions"
import {
  generateRegistrationOptions,
  RegistrationResponseJSON,
  PublicKeyCredentialCreationOptionsJSON,
  verifyRegistrationResponse,
  AuthenticatorTransport,
} from "@simplewebauthn/server"
import { DatabaseError } from "pg"

export async function signUp(username: string | null) {
  try {
    if (!username?.trim()) return "Sorry you must enter something"
    const user = await getUser(username)
    if (user.rowCount === 1) {
      return "You must login instead"
    }

    const createdUser = await createUser(username)
    if (!createdUser.rowCount) {
      return "Something failed with user creation"
    }

    const getUserDetails = (await getUser(username)).rows
    const passkeys = (await getCredentials(username)).rows

    const options = await generateRegistrationOptions({
      rpName: process.env.rpName as string,
      rpID: process.env.rpID as string,
      userName: getUserDetails[0].username,
      attestationType: "none",
      excludeCredentials: passkeys.map((p) => ({
        id: p.id,
        transports: p.transports,
      })),
      authenticatorSelection: {
        residentKey: "preferred",
        userVerification: "preferred",
        authenticatorAttachment: "platform",
      },
    })
    return options
  } catch (err) {
    console.error(err)
    return "Some error occurred."
  }
}

export async function getResponse(
  username: string,
  attResp: RegistrationResponseJSON,
  // original server response i sent being SENT AGAIN for the options.challenge
  resp: PublicKeyCredentialCreationOptionsJSON
) {
  try {
    const verified = await verifyRegistrationResponse({
      response: attResp,
      expectedChallenge: resp.challenge,
      expectedOrigin: process.env.origin as string,
      expectedRPID: process.env.rpID as string,
    })

    if (verified.verified) {
      const newPasskey: CredentialModel = {
        cred_id: verified.registrationInfo.credential.id,
        cred_public_key: verified.registrationInfo.credential.publicKey,
        user_id: (await getUser(username)).rows[0].id,
        webauthn_user_id: resp.user.id,
        counter: verified.registrationInfo.credential.counter,
        device_type: verified.registrationInfo.credentialDeviceType,
        backed_up: verified.registrationInfo.credentialBackedUp,
        transports: verified.registrationInfo.credential
          .transports as AuthenticatorTransport[],
      }
      const created = await createPasskey(newPasskey)
      console.log(created)
    }

    return verified.verified
  } catch (err) {
    console.log(err)
    if (err instanceof DatabaseError) {
      return "Passkey creation failed"
    }
  }
}
