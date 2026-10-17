"use client"

import { signUp, getResponse } from "@/app/register/actions"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { startRegistration } from "@simplewebauthn/browser"
import { useRouter } from "next/navigation"
import { useState } from "react"

export function SignupForm({ ...props }: React.ComponentProps<typeof Card>) {
  const [errors, setErrors] = useState<string>("")
  const router = useRouter()
  const handleRegistration = async (formdata: FormData) => {
    //server action
    const resp = await signUp(String(formdata.get("username")))

    if (typeof resp === "string") {
      setErrors(resp)
    } else if (resp) {
      const attResp = await startRegistration({ optionsJSON: resp })
      // this helps create the passkey after signup
      const verificationResp = await getResponse(
        String(formdata.get("username")),
        attResp,
        resp
      )
      if (typeof verificationResp === "string") {
        setErrors(verificationResp)
      } else {
        router.push("/")
      }
    }
  }

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
            {errors && <p className="text-xs text-red-400">{errors}</p>}
            <Field>
              <Button type="submit">Create Account</Button>
              <FieldDescription className="px-6 text-center">
                Already have an account? <a href="/login">Sign in</a>
              </FieldDescription>
            </Field>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  )
}
