"use server";

import { verifyJWT } from "@/lib/authorization";
import { getUser, submitVote } from "@/lib/dbActions";
import { publishEvent } from "@/lib/pollEvents";
import { cookies } from "next/headers";

export default async function voteService(pollId: string, optionId: string) {
    const cookieStore = await cookies();
    const token_cookie = (await cookies()).get("jwt_token")?.value;
    if (!token_cookie) return "You must authenticate first";
    console.log("GOT THE JWT TOKEN: ", token_cookie);
    const verifiedToken = await verifyJWT(token_cookie as string);
    if (!verifiedToken.auth) return "You are not authenticated";
    console.log("DID THE JWT AUTH: ", verifiedToken);

    // sorry my jwt stores the username actually
    const username = verifiedToken.payload?.userId as string;
    const user = (await getUser(username)).rows[0];
    console.log("GOT THE USER FROM DB: ", user);

    cookieStore.set(`${pollId}`, `${optionId}`);
    const resp = await submitVote(user.id, pollId, optionId);
    console.log("FINALLY CREATING THE VOTE: ", resp);

    // RELEASE A NOTIFICATION TO THE SSE HANDLER with PUBLISH(pollid)
    if (resp) {
        publishEvent(pollId);
    }
}
