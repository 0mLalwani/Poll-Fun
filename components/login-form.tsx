"use client";
import { cn } from "cn";

import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Field,
    FieldDescription,
    FieldGroup,
    FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { login, verifyAuth } from "@/app/login/actions";
import { useState } from "react";
import { startAuthentication } from "@simplewebauthn/browser";
import { useRouter } from "next/navigation";

export function LoginForm({
    className,
    ...props
}: React.ComponentProps<"div">) {
    const [errors, setErrors] = useState<string>("");
    const router = useRouter();

    const handleLogin = async (formdata: FormData) => {
        const username = String(formdata.get("username"));

        const options = await login(username);
        console.log("FIRSTLY SERVER SIDE LOGIN OPTIONS GOTTEN: ", options);

        if (typeof options === "string") {
            setErrors(options);
        } else if (options) {
            console.log("SECONDLY STARTING PASSKEY AUTHENTICATION");
            const asseResp = await startAuthentication({
                optionsJSON: options,
            });
            console.log("THIRDLY AUTHENTICATION DONE FROM CLIENT", asseResp);
            const verificationResp = await verifyAuth(
                String(formdata.get("username")),
                asseResp
            );
            console.log(
                "FOURTHLY SENT AND GOTTEN BACK THE SERVER SIDE VERIFICATION RESPONSE: ",
                verificationResp
            );
            if (typeof verificationResp === "string") {
                setErrors(verificationResp);
            } else {
                router.push("/");
            }
        }
    };

    return (
        <div className={cn("flex flex-col gap-6", className)} {...props}>
            <Card>
                <CardHeader>
                    <CardTitle>Login to your account</CardTitle>
                    <CardDescription>
                        Enter your email below to login to your account
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form action={handleLogin}>
                        <FieldGroup>
                            <Field>
                                <FieldLabel htmlFor="username">
                                    Username
                                </FieldLabel>
                                <Input
                                    id="username"
                                    type="text"
                                    name="username"
                                    placeholder="I hope you remember this"
                                    required
                                />
                            </Field>
                            {errors && (
                                <p className="text-xs text-red-400">{errors}</p>
                            )}
                            <Field>
                                <Button type="submit">Login</Button>
                                <FieldDescription className="text-center">
                                    Don&apos;t have an account?{" "}
                                    <a href="/register">Register</a>
                                </FieldDescription>
                            </Field>
                        </FieldGroup>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
