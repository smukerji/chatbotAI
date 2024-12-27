import React, { useContext, useEffect, useState } from "react";
import Image from "next/image";
import infoImage from "../../../../../../public/voiceBot/SVG/info-circle.svg";
import { message } from "antd";
import { CreateAssistantFlowContext } from "@/app/_helpers/client/Context/CreateAssistantFlowContext";

function ChooseIndustryExpert() {
  const [industryTypes, setIndustryTypes] = useState([]);

  /// get the context data
  const createAssistantFlowContext: any = useContext(
    CreateAssistantFlowContext
  );
  const createAssistantFlowContextDetails =
    createAssistantFlowContext.createAssistantFlowInfo;

  /// get the industry list from api
  async function getIndustryList() {
    const res = await fetch(`/create-first-assistant/industry-types/api`);
    /// error handling
    if (!res.ok) {
      message.error("Failed to fetch industry types");
      return;
    }
    const response = await res.json();

    setIndustryTypes(response.industryTypes);
  }

  useEffect(() => {
    getIndustryList();
  }, []);
  return (
    <div>
      <div className="title">
        <h1>Choose your industry expert</h1>
        <span>
          Choose your specialized AI expert for tasks like translation,
          diagnostics, finance, or customer service needs.
        </span>
      </div>

      <div className="assistant-wrapper">
        {industryTypes?.length > 0 &&
          industryTypes.map((assistant: any, index: number) => {
            return (
              <button
                className={
                  createAssistantFlowContextDetails.industryExpertType
                    .abbreviation === assistant.abbreviation
                    ? "assistant-card selected-assistant"
                    : "assistant-card"
                }
                key={assistant._id}
                onClick={() => {
                  createAssistantFlowContext.handleChange("industryExpertType")(
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
                      <Image
                        src={infoImage}
                        alt=""
                        height={100}
                        width={100}
                      ></Image>
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

export default ChooseIndustryExpert;
