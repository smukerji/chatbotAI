"use client";
import * as React from "react";
import { redirect, useSearchParams, useRouter } from "next/navigation";
import { useCookies } from "react-cookie";
const IntegrationProgress = () => {
  const params = useSearchParams();
  const cookies = useCookies();
  const router = useRouter();

  const postData = {
    chatbotId: params?.get("chatbotId"),
    chatbotName: params?.get("chatbotName"),
    userId: cookies[0]?.userId,
    provider: cookies[0]?.provider,
    providerAccountId: cookies[0]?.providerAccountId,
    accessToken: cookies[0]?.haccessToken,
    refreshToken: cookies[0]?.hrefreshToken,
    expiresAt: cookies[0]?.hexpiresAt,
  };

  const handlePostRequest = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_WEBSITE_URL}/chatbot/dashboard/integrations/api`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(postData),
        }
      );

      const data = await response.json();
      if (data?.message === "success") {
        router.push(`${process.env.NEXT_PUBLIC_WEBSITE_URL}/chatbot`);
      }
    } catch (error) {
      console.error("Error making POST request:", error);
    }
  };

  React.useEffect(() => {
    handlePostRequest();
  }, []);

  return (
    <>
      <p>Integration progress</p>
    </>
  );
};

export default IntegrationProgress;
