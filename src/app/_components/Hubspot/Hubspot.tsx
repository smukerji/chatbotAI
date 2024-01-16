import { Button } from "antd";
import { signIn, useSession } from "next-auth/react";
import React, { useContext, useEffect } from "react";
import "./hubspot.scss";
import { CheckCircleTwoTone } from "@ant-design/icons";
import { CreateBotContext } from "@/app/_helpers/client/Context/CreateBotContext";

const Hubspot = () => {
  const { data: session } = useSession();
  const botContext: any = useContext(CreateBotContext);
  const botDetails = botContext?.createBotInfo;
  useEffect(() => {
    if (session?.accessToken) {
      botContext.handleChange("isHubspotConnected")(true);
    }
  }, [session?.accessToken]);

  console.log("session", session);

  return (
    <div className="hubspot-source-container">
      {botDetails?.isHubspotConnected ? (
        <div className="hubspot-connection-status">
          <CheckCircleTwoTone
            twoToneColor="#52c41a"
            style={{ fontSize: "300%" }}
          />
          <h4>Connected with hubspot</h4>
        </div>
      ) : (
        <Button type="primary" onClick={() => signIn("hubspot")}>
          Connect with hubspot
        </Button>
      )}
    </div>
  );
};

export default Hubspot;
