"use server"
import { getCredentials, getUser } from "@/lib/dbActions"
import { AuthenticationResponseJSON } from "@simplewebauthn/browser"
import {
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
  PublicKeyCredentialRequestOptionsJSON,
} from "@simplewebauthn/server"
import { cookies } from "next/headers"

export async function login(username: string | null) {
  try {
    if (!username?.trim()) return "Sorry you must enter something"
    const user = await getUser(username)
    if (user.rowCount === 0) {
      return "You must register first"
    }
    const passkeys = (await getCredentials(username)).rows

    const options: PublicKeyCredentialRequestOptionsJSON =
      await generateAuthenticationOptions({
        rpID: process.env.rpID as string,
        allowCredentials: passkeys.map((passkey) => ({
          id: passkey.id,
          transports: passkey.transports,
        })),
      })

    const cookieStore = await cookies()
    cookieStore.set("login_challenge", options.challenge, {
      expires: 3000,
      httpOnly: true,
      path: "/login",
      sameSite: "lax",
      // secure: true,
    })

    return options
  } catch (err) {
    console.log(err)
  }
}

export async function verifyAuthentication(
  username: string,
  resp: AuthenticationResponseJSON
) {
  const passkey = (await getCredentials(username)).rows
  const cookieStore = await cookies()
  const challenge = cookieStore.get("login_challenge")
  try {
    const verification = await verifyAuthenticationResponse({
      response: resp,
      expectedChallenge: challenge?.value as string,
      expectedOrigin: origin,
      expectedRPID: process.env.rpID as string,
      credential: {
        id: passkey.id,
        publicKey: passkey.publicKey,
        counter: passkey.counter,
        transports: passkey.transports,
      },
    })
    return verification
  } catch (err) {
    console.log(err)
  }
}
