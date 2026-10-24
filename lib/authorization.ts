import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const secret = new TextEncoder().encode(process.env.JWT_SECRET as string);

export async function getJWT(userId: string) {
    const token = await new SignJWT({ userId })
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime("7d")
        .sign(secret);
    return token;
}
export async function verifyJWT(cookie: string) {
    if (!cookie) return { auth: false };
    const verified = await jwtVerify(cookie, secret, {
        algorithms: ["HS256"],
    });
    return { auth: true, payload: verified.payload };
}
