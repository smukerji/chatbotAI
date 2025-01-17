import React, { useContext } from "react";
import "./select-assistant-type.scss";
import Image from "next/image";
import ChatbotImage from "../../../../../../public/sections-images/create-first-assistant/chatbot/chatbot-creation-image.jpg";
import VoicebotImage from "../../../../../../public/sections-images/create-first-assistant/voicebot/voicebot-creation-image.jpg";
import {
  CreateAssistantFlowContext,
  SelectedAssistantType,
} from "@/app/_helpers/client/Context/CreateAssistantFlowContext";

function SelectAssistantType() {
  /// get the context data
  const createAssistantFlowContext: any = useContext(
    CreateAssistantFlowContext
  );
  const createAssistantFlowContextDetails =
    createAssistantFlowContext.createAssistantFlowInfo;

  /// select assistant type
  return (
    <div className="select-assistant-container">
      <div className="title">
        <h1>AI Agent platforms. Lets try now !</h1>
        <span>
          Build your own customised AI chatbot and Voice Agent using Torri
        </span>
      </div>
      <div className="select-assistant-type">
        <div className="assistant-type">
          <div
            onClick={() =>
              createAssistantFlowContext.handleChange("creationFlow")(
                SelectedAssistantType.CHAT
              )
            }
            className={`assistant-type-item ${
              createAssistantFlowContextDetails.creationFlow ===
              SelectedAssistantType.CHAT
                ? "selected-assistant"
                : ""
            }`}
          >
            <Image src={ChatbotImage} alt="assistant-type-1" unoptimized />
            <h2>Chatbot</h2>
            <p>AI Custom Chat Agent</p>
          </div>
          <div
            className={`assistant-type-item ${
              createAssistantFlowContextDetails.creationFlow ===
              SelectedAssistantType.VOICE
                ? "selected-assistant"
                : ""
            }`}
            // onClick={() =>
            //   createAssistantFlowContext.handleChange("creationFlow")(
            //     SelectedAssistantType.VOICE
            //   )
            // }
          >
            <Image src={VoicebotImage} alt="assistant-type-2" unoptimized />
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <h2>Voicebot</h2>
              <span
                style={{
                  color: "#FE632F",
                  fontSize: "16px",
                  fontWeight: 500,
                  lineHeight: "24px",
                  textAlign: "center",
                  fontFamily: "General Sans",
                  padding: "8px 16px",
                  borderRadius: "1000px",
                  background: "#FFF2EE",
                  marginTop: "24px",
                }}
              >
                Coming Soon
              </span>
            </div>
            <p>Customise your AI Voice Agent</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SelectAssistantType;
