import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "../_helpers/server/auth";

export default function HomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const userId = cookies().get("userId");
  const authorization: any = cookies().get("authorization");

  // if user is not logged in redirect to login
  if (userId && authorization && !auth.isAuthenticated()) {
    const returnUrl = encodeURIComponent(headers().get("x-invoke-path") || "/");
    redirect(`/account/login?returnUrl=${returnUrl}`);
  }
  return <>{children}</>;
}
