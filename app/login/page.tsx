import { LoginForm } from "@/components/login-form";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function Page() {
    const token = await (await cookies()).get("jwt_token")?.value;
    if (token) redirect("/");
    return (
        <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
            <div className="w-full max-w-sm">
                <LoginForm />
            </div>
        </div>
    );
}
