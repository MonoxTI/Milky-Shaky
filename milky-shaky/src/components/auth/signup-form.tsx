"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signupAction } from "@/features/auth/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

function FieldError({ messages }: { messages?: string[] }) {
  if (!messages?.[0]) return null;
  return <p className="text-sm text-destructive">{messages[0]}</p>;
}

export function SignupForm() {
  const [state, formAction, pending] = useActionState(signupAction, null);

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Sign up</CardTitle>
        <CardDescription>Create an account to start ordering.</CardDescription>
      </CardHeader>

      <form action={formAction}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="firstName">Full name</Label>
            <Input id="firstName" name="firstName" autoComplete="given-name" required />
            <FieldError messages={state?.fieldErrors?.firstName} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" autoComplete="email" required />
            <FieldError messages={state?.fieldErrors?.email} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="mobile">Mobile number</Label>
            <Input id="mobile" name="mobile" type="tel" autoComplete="tel" placeholder="082 123 4567" required />
            <FieldError messages={state?.fieldErrors?.mobile} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
            />
            <p className="text-xs text-muted-foreground">Must be at least 8 characters.</p>
            <FieldError messages={state?.fieldErrors?.password} />
          </div>

          {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
        </CardContent>

        <CardFooter className="flex flex-col gap-3">
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Creating account..." : "Get started"}
          </Button>
          <p className="text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="underline">
              Log in
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}