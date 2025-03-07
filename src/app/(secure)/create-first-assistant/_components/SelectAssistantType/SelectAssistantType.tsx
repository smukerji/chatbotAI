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
        <h1>AI Agent platform. Create your own AI Agent!</h1>
        <span>Create your own AI chat agent or AI voice agent with Torri</span>
      </div>
      <div className="select-assistant-type">
        <div className="assistant-type">
          <div
            onClick={() =>
            {
              createAssistantFlowContext.handleChange("creationFlow")(
                SelectedAssistantType.CHAT
              );
              createAssistantFlowContext.setUserChoosenAssistantValue("Chat");
            }
              
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
            <p>Customise your AI Chat Agent</p>
          </div>
          <div
            className={`assistant-type-item ${
              createAssistantFlowContextDetails.creationFlow ===
              SelectedAssistantType.VOICE
                ? "selected-assistant"
                : ""
            }`}
            onClick={() =>
            {
              createAssistantFlowContext.handleChange("creationFlow")(
                SelectedAssistantType.VOICE
              );

              createAssistantFlowContext.setUserChoosenAssistantValue("Voice");
              

            }
              
            }
          >
            <Image src={VoicebotImage} alt="assistant-type-2" unoptimized />
            <h2>Voicebot</h2>
            <p>Customise your AI Voice Agent</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SelectAssistantType;
