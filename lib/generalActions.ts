"use server";

import { cookies } from "next/headers";

export default async function handleLogOut() {
    const cookieStore = await cookies();
    cookieStore.delete("jwt_token");
}
