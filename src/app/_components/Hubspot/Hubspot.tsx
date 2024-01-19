"use client";
import { Button, Form, Input } from "antd";
import { signIn, useSession, signOut } from "next-auth/react";
import React, { useContext, useEffect, useState } from "react";
import "./hubspot.scss";
import { CheckCircleTwoTone } from "@ant-design/icons";
import { CreateBotContext } from "@/app/_helpers/client/Context/CreateBotContext";
import { useSearchParams } from "next/navigation";
import { useCookies } from "react-cookie";

type FieldType = {
  hubspotAccessToken?: string;
};

const Hubspot = ({ chatbotId }: any) => {
  const [initialToken, setInitialToken] = useState<string>("");
  // const { data: session } = useSession();
  const botContext: any = useContext(CreateBotContext);
  const botDetails = botContext?.createBotInfo;

  const params: any = useSearchParams();
  const chatbot = JSON.parse(decodeURIComponent(params.get("chatbot")));

  const getAccessToken = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_WEBSITE_URL}/chatbot/dashboard/hubspot-integration/${chatbotId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      const data = await response.json();
      botContext.handleChange("hubspotAccessToken")(data?.hubspotAccessToken);
      setInitialToken(data?.hubspotAccessToken);
    } catch (error) {
      console.error("Error making POST request:", error);
    }
  };

  useEffect(() => {
    getAccessToken();
  }, []);

  // useEffect(() => {
  //   if (session?.accessToken) {
  //     botContext.handleChange("isHubspotConnected")(true);
  //   }
  // }, [session?.accessToken]);

  const onFinish = async (values: any) => {
    console.log("Success:", values);
    const postData = {
      chatbotId: chatbot?.id,
      chatbotName: chatbot?.name,
      hubspotAccessToken: values.hubspotAccessToken,
    };
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_WEBSITE_URL}/chatbot/dashboard/hubspot-integration`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(postData),
        }
      );

      const data = await response.json();
      console.log("data ", data);
    } catch (error) {
      console.error("Error making POST request:", error);
    }
  };

  console.log("botDetails", botDetails);

  return (
    <>
      <div className="hubspot-source-container">
        {/* {botDetails?.isHubspotConnected ? (
          <div className="hubspot-connection-status">
            <CheckCircleTwoTone
              twoToneColor="#52c41a"
              style={{ fontSize: "300%" }}
            />
            <h4>Connected with hubspot</h4>
            <Button type="primary" onClick={() => signOut()}>
              Disconnect
            </Button>
          </div>
        ) : (
          <Button
            type="primary"
            onClick={
              () =>
                signIn("hubspot", {
                  callbackUrl: `${process.env.NEXT_PUBLIC_WEBSITE_URL}/chatbot/dashboard/integrations?chatbotId=${chatbot.id}&chatbotName=${chatbot.name}`,
                })
              // signIn("hubspot")
            }
          >
            Connect with hubspot
          </Button>
        )} */}
        <div>
          <h4>Set Hubspot Access Token</h4>
          <Input
            name="hubspotAccessToken"
            // value={botDetails?.hubspotAccessToken}
            value={botDetails?.hubspotAccessToken}
            onChange={(e) => {
              botContext.handleChange("hubspotAccessToken")(e.target.value);
            }}
          />

          <Button
            type="primary"
            disabled={botDetails?.hubspotAccessToken === initialToken}
            onClick={() =>
              onFinish({ hubspotAccessToken: botDetails?.hubspotAccessToken })
            }
          >
            Submit
          </Button>
        </div>
      </div>
    </>
  );
};

export default Hubspot;
