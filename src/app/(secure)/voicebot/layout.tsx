import { cookies, headers } from "next/headers";
import { auth } from "../../_helpers/server/auth";
import { redirect } from "next/navigation";
import { CreateBotDataProvider } from "../../_helpers/client/Context/CreateBotContext";
import { ChatbotSettingDataProvider } from "../../_helpers/client/Context/ChatbotSettingContext";

export default function VoiceBotsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const userId = cookies().get("userId");
  const authorization = cookies().get("authorization");

  // if user is not logged in redirect to login
  if (userId && authorization && !auth.isAuthenticated()) {
    const returnUrl = encodeURIComponent(headers().get("x-invoke-path") || "/");

    redirect(`/account/login?returnUrl=${returnUrl}`);
  }
  return <>{children}</>;
}
