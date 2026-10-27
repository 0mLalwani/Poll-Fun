"use client";

import { signUp, getResponse } from "@/app/register/actions";
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
import { startRegistration } from "@simplewebauthn/browser";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function SignupForm({ ...props }: React.ComponentProps<typeof Card>) {
    const [errors, setErrors] = useState<string>("");
    const router = useRouter();

    const handleRegistration = async (formdata: FormData) => {
        const username = String(formdata.get("username"));

        const resp = await signUp(username);
        console.log(
            "FIRSTLY SERVER SIDE USER CREATED AND OPTIONS GENERATED",
            resp
        );

        if (typeof resp === "string") {
            setErrors(resp);
        } else if (resp) {
            try {
                const attResp = await startRegistration({ optionsJSON: resp });
                console.log(
                    "SECONDLY BROWSER SIDE, REGISTRATION INITIATED(PASSKEY GENERATED) :",
                    attResp
                );
                const verificationResp = await getResponse(username, attResp);
                console.log(
                    "THIRDLY SERVER SIDE PASSKEY SENT (AFTER BROWSER CREATED IT) :",
                    verificationResp
                );
                router.push("/");
            } catch {
                setErrors(
                    "Something went wrong with your passkey registration"
                );
            }
        }
    };

    return (
        <Card {...props}>
            <CardHeader>
                <CardTitle>Create an account</CardTitle>
                <CardDescription>
                    Enter your information below to create your account
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form action={handleRegistration}>
                    <FieldGroup>
                        <Field>
                            <FieldLabel htmlFor="username">Username</FieldLabel>
                            <Input
                                id="username"
                                name="username"
                                type="text"
                                required
                                onChange={() => setErrors("")}
                            />
                            <FieldDescription className="text-xs">
                                3+ Characters
                            </FieldDescription>
                        </Field>
                        {errors && (
                            <p className="text-xs text-red-400">{errors}</p>
                        )}
                        <Field>
                            <Button type="submit">Create Account</Button>
                            <FieldDescription className="px-6 text-center">
                                Already have an account?{" "}
                                <a href="/login">Login</a>
                            </FieldDescription>
                        </Field>
                    </FieldGroup>
                </form>
            </CardContent>
        </Card>
    );
}
