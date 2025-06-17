import React, { useContext, useEffect } from "react";
import { CreateBotContext } from "../../../../../_helpers/client/Context/CreateBotContext";
import Icon from "../../../../../_components/Icon/Icon";
import DocumentIcon from "@/assets/svg/DocumentIcon";
import General from "./_components/general/General";
import GeneralIcon from "@/assets/svg/GeneralIcon";
import ModelIcon from "@/assets/svg/ModelIcon";
import ChatInterfaceIcon from "@/assets/svg/ChatInterfaceIcon";
import SecurityIcon from "@/assets/svg/SecurityIcon";
import LeadIcon from "@/assets/svg/LeadIcon";
import NotificationsIcon from "@/assets/svg/NotificationsIcon";
import "./../Settings/settings.scss";
import Model from "./_components/model/Model";
import ChatInterface from "./_components/chatInterface/ChatInterface";
import Security from "./_components/security/Security";
import Lead from "./_components/lead/Lead";
import CustomModal from "../CustomModal/CustomModal";
import { useRouter, useSearchParams } from "next/navigation";
import OpenRouterModels from "./_components/model/OpenRouterModels";
import { ChatbotSettingContext } from "@/app/_helpers/client/Context/ChatbotSettingContext";

function Settings({
  chatbotId,
  chatbotName,
  isPlanNotification,
  setIsPlanNotification,
}: any) {
  const router = useRouter();
  const botContext: any = useContext(CreateBotContext);
  const botDetails = botContext?.createBotInfo;

  /// check which setting tab is active
  const chabotSettings = botDetails?.chabotSettings;

  /// get the bot settings context
  const botSettingContext: any = useContext(ChatbotSettingContext);

  /// fetch the params
  const params: any = useSearchParams();
  const chatbot = JSON.parse(decodeURIComponent(params.get("chatbot")));

  /// if bot-v3 then change the default model to open router

  useEffect(() => {
    if (chatbot?.botType === "bot-v3") {
      console.log("open router model");

      botSettingContext?.handleChange("model")("openai/gpt-3.5-turbo");
    }
  }, []);

  return (
    <div className="settings-container">
      <CustomModal
        open={isPlanNotification}
        setOpen={setIsPlanNotification}
        header={"Upgrade Now to create new Chatbots!"}
        content={"Upgrade now to access your chatbots!"}
        footer={
          <button
            onClick={() => {
              router.push("/home/pricing");
            }}
          >
            Upgrade Now
          </button>
        }
      />
      {/*------------------------------------------top-section----------------------------------------------*/}
      <div className="top">
        {/*------------------------------------------header----------------------------------------------*/}
        <div className="sources-header">
          {/*------------------------------------------options-container----------------------------------------------*/}
          <ul className="options-container">
            <li
              className={`${chabotSettings === "general" ? "active" : ""}`}
              value={"general"}
              onClick={() =>
                botContext?.handleChange("chabotSettings")("general")
              }
            >
              <Icon Icon={GeneralIcon} />
              <h3>General</h3>
            </li>
            <li
              className={`${chabotSettings === "model" ? "active" : ""}`}
              value={"model"}
              onClick={() =>
                botContext?.handleChange("chabotSettings")("model")
              }
            >
              <Icon Icon={ModelIcon} />
              <h3>Model</h3>
            </li>
            <li
              className={`${
                chabotSettings === "chatInterface" ? "active" : ""
              }`}
              value={"chatInterface"}
              onClick={() =>
                botContext?.handleChange("chabotSettings")("chatInterface")
              }
            >
              <Icon Icon={ChatInterfaceIcon} />
              <h3>Chat interface</h3>
            </li>
            <li
              className={`${chabotSettings === "security" ? "active" : ""}`}
              value={"security"}
              onClick={() =>
                botContext?.handleChange("chabotSettings")("security")
              }
            >
              <Icon Icon={SecurityIcon} />
              <h3>Security</h3>
            </li>
            <li
              className={`${chabotSettings === "lead" ? "active" : ""}`}
              value={"lead"}
              onClick={() => botContext?.handleChange("chabotSettings")("lead")}
            >
              <Icon Icon={LeadIcon} />
              <h3>Lead</h3>
            </li>
            {/* <li
              className={`${
                chabotSettings === "notifications" ? "active" : ""
              }`}
              value={"notifications"}
              onClick={() =>
                botContext?.handleChange("chabotSettings")("notifications")
              }
            >
              <Icon Icon={NotificationsIcon} />
              <h3>Notifications</h3>
            </li> */}
          </ul>
        </div>
      </div>
      {/* --------------------------------------- for bottom ----------------------------------------------*/}
      <div className="bottom">
        <div className="left">
          {chabotSettings === "general" && (
            <General chatbotId={chatbotId} chatbotName={chatbotName} />
          )}
          {chabotSettings === "model" && chatbot?.botType === "bot-v3" && (
            <OpenRouterModels chatbotId={chatbotId} />
          )}
          {chabotSettings === "model" && chatbot?.botType !== "bot-v3" && (
            <Model chatbotId={chatbotId} />
          )}
          {chabotSettings === "chatInterface" && (
            <ChatInterface chatbotId={chatbotId} />
          )}
          {chabotSettings === "security" && <Security chatbotId={chatbotId} />}
          {chabotSettings === "lead" && <Lead chatbotId={chatbotId} />}
          {chabotSettings === "notifications" && <h1>notifications</h1>}
        </div>
      </div>
    </div>
  );
}

export default Settings;
