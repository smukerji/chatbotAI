import { cookies, headers } from "next/headers";
import { auth } from "../../../_helpers/server/auth";
import { redirect } from "next/navigation";
import { MicrophoneContextProvider } from "@/app/_helpers/client/Context/MicrophoneContext";
import { DeepgramContextProvider } from "@/app/_helpers/client/Context/DeepgramContext";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const userId = cookies().get("userId");
  const authorization = cookies().get("authorization");

  // if user is not logged in redirect to login
  if (userId && authorization && !auth.isAuthenticated()) {
    const returnUrl = encodeURIComponent(
      headers().get("x-invoke-path") || "/dashboard"
    );

    redirect(`/account/login?returnUrl=${returnUrl}`);
  }
  return (
    <DeepgramContextProvider>
      <MicrophoneContextProvider>{children}</MicrophoneContextProvider>
    </DeepgramContextProvider>
  );
}
