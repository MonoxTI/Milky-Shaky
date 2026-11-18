import { Button } from "@/components/ui/button";
import { logoutAction } from "@/features/auth/actions";

export function SignOutButton() {
  return (
    <form action={logoutAction}>
      <Button type="submit" variant="outline">
        Log out
      </Button>
    </form>
  );
}