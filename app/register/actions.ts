"use server"

import "dotenv/config"
import connPool from "@/lib/db"
import {
  generateRegistrationOptions,
  RegistrationResponseJSON,
  PublicKeyCredentialCreationOptionsJSON,
  verifyRegistrationResponse,
  AuthenticatorTransport,
} from "@simplewebauthn/server"
import { UUID } from "crypto"
import { DatabaseError } from "pg"

type UserModel = {
  id: UUID
  username: string
  created_at: Date
}
type CredentialModel = {
  cred_id: string
  cred_public_key: Uint8Array
  user_id: UUID
  webauthn_user_id: string
  counter: number
  device_type: string
  backed_up: boolean
  transports?: AuthenticatorTransport[]
}
const getUser = async (username: string) => {
  const resp = await connPool.query("SELECT * FROM users WHERE username=$1", [
    username,
  ])
  return resp
}
const createUser = async (username: string) => {
  const resp = await connPool.query(
    "INSERT INTO users (id, username) VALUES ($1, $2)",
    [crypto.randomUUID(), username]
  )
  return resp
}
const getCredentials = async (username: string) => {
  const resp = await connPool.query(
    `SELECT * FROM passkey_credentials
      JOIN users ON id = users.id
      WHERE users.username = ($1)`,
    [username]
  )
  return resp
}
const createPasskey = async (passkey: CredentialModel) => {
  const {
    cred_id,
    cred_public_key,
    user_id,
    webauthn_user_id,
    counter,
    device_type,
    backed_up,
    transports,
  } = passkey
  const resp = await connPool.query(
    `INSERT INTO passkey_credentials (cred_id, cred_public_key, user_id, webauthn_user_id, counter, device_type, backed_up, transports) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [
      cred_id,
      cred_public_key,
      user_id,
      webauthn_user_id,
      counter,
      device_type,
      backed_up,
      transports?.join(","),
    ]
  )
  return resp
}
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
