"use server";

import { verifyJWT } from "@/lib/authorization";
import connPool from "@/lib/db";
import { getUser } from "@/lib/dbActions";
import { cookies } from "next/headers";

export default async function savePoll(formdata: FormData) {
    const token_cookie = (await cookies()).get("jwt_token")?.value;
    const verifiedToken = await verifyJWT(token_cookie as string);
    if (!verifiedToken.auth) return "You are not authenticated";
    console.log("FIRSTLY VERIFIED THE USER'S JWT: ", verifiedToken);
    const poll = {
        ...(formdata.get("title") && {
            title: String(formdata.get("title")).trim(),
        }),
        ...(formdata.get("option1") && {
            option1: String(formdata.get("option1")).trim(),
        }),
        ...(formdata.get("option2") && {
            option2: String(formdata.get("option2")).trim(),
        }),
        ...(formdata.get("option3") && {
            option3: String(formdata.get("option3")).trim(),
        }),
        ...(formdata.get("option4") && {
            option4: String(formdata.get("option4")).trim(),
        }),
    };
    if (!poll.title?.trim() || !poll.option1?.trim() || !poll.option2?.trim())
        return "You didn't provide the bare minimum options for a poll";
    console.log("SECONDLY HERE'S THE FINAL POLL OBJECT: ", poll);

    const user = await getUser(verifiedToken.payload?.userId as string);
    if (!user.rowCount)
        return "You do not have an account yet, please register";
    console.log("THIRDLY HERE'S THE USER GOTTEN USER FROM DB", user.rows[0]);

    const user_id = await user.rows[0].id;
    const poll_uuid = crypto.randomUUID();

    const savePollInDB = await connPool.query(
        `
        INSERT INTO polls (id, title, user_id)
        VALUES ($1, $2, $3)`,
        [poll_uuid, poll.title, user_id]
    );
    console.log("FOURTHLY HERE'S THE POLL SAVED IN DB: ", savePollInDB);

    const { title, ...options } = poll;
    for (const option_title of Object.values(options)) {
        console.log(`HERE'S OPTION TITLE ${option_title}`);

        const option_uuid = crypto.randomUUID();
        const saveOptionInDB = await connPool.query(
            `
        INSERT INTO options (id, title, poll_id)
        VALUES ($1, $2, $3)`,
            [option_uuid, option_title, poll_uuid]
        );
        console.log("HERE'S THE OPTION SAVED IN DB: ", saveOptionInDB);
    }

    // save object to db
}
