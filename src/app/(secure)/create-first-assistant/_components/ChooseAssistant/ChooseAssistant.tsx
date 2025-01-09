"use client";
import React, { useContext, useEffect, useState } from "react";
import customTemplate from "../../../../../../public/voiceBot/SVG/profile-circle.svg";
import Image from "next/image";
import infoImage from "../../../../../../public/voiceBot/SVG/info-circle.svg";
import { message, Tooltip } from "antd";
import { CreateAssistantFlowContext } from "@/app/_helpers/client/Context/CreateAssistantFlowContext";

function ChooseAssistant() {
  const [assistantTypes, setAssistantTypes] = useState([]);

  /// get the context data
  const createAssistantFlowContext: any = useContext(
    CreateAssistantFlowContext
  );
  const createAssistantFlowContextDetails =
    createAssistantFlowContext.createAssistantFlowInfo;
  /// get the assistant list from api
  async function getAssistantList() {
    const res = await fetch(`/create-first-assistant/assistant-types/api`);
    /// error handling
    if (!res.ok) {
      message.error("Failed to fetch assistant types");
      return;
    }
    const response = await res.json();

    setAssistantTypes(response.assistantTypes);
  }

  useEffect(() => {
    getAssistantList();
  }, []);

  return (
    <div>
      {/* : "Choose your industry expert"} */}

      {/* : "Choose your specialized AI expert for tasks like translation, diagnostics, finance, or customer service needs."} */}

      <div className="title">
        <h1> Let&apos;s create a new assistant</h1>
        <span>
          Get started by selecting the AI assistant that best fits your needs
          and preferences.
        </span>
      </div>

      <div className="assistant-wrapper">
        <div className="custom_assistant-card">
          <div className="blank-template">
            <div className="image-card">
              <Image
                src={customTemplate}
                alt=""
                height={100}
                width={100}
              ></Image>
            </div>
            <h3 className="card_sub-header">Blank Template</h3>
          </div>
        </div>
        {assistantTypes?.length > 0 &&
          assistantTypes.map((assistant: any, index: number) => {
            return (
              <button
                className={`assistant-card ${
                  createAssistantFlowContextDetails.assistantType
                    ?.abbreviation === assistant.abbreviation
                    ? "selected-assistant"
                    : ""
                }`}
                key={assistant._id}
                onClick={() => {
                  createAssistantFlowContext.handleChange("assistantType")(
                    assistant
                  );
                }}
              >
                <div className="card-image">
                  <Image
                    src={assistant.imageUrl}
                    alt=""
                    height={100}
                    width={100}
                    unoptimized
                  ></Image>
                </div>
                <div className="header-information">
                  <div className="header_container">
                    <h2 className="card_header">{assistant.title}</h2>
                    <div className="image-info">
                      <Tooltip
                        placement="bottom"
                        title={
                          "This template simplifies the process of setting appointments by providing a clear schedule, addressing frequently asked questions, and offering helpful service details for both patients and staff."
                        }
                        // arrow={mergedArrow}
                      >
                        <Image
                          src={infoImage}
                          alt=""
                          height={100}
                          width={100}
                        ></Image>
                      </Tooltip>
                    </div>
                  </div>

                  <h3 className="card_sub-header">{assistant.description}</h3>
                </div>
              </button>
            );
          })}
      </div>
    </div>
  );
}

export default ChooseAssistant;
