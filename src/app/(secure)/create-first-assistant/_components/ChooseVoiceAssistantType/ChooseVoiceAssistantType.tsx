import React from "react";
import Image from "next/image";

import infoImage from "../../../../../../public/voiceBot/SVG/info-circle.svg";
import { Tooltip } from 'antd';


import customTemplate from "../../../../../../public/voiceBot/SVG/profile-circle.svg";

interface AssistantListProps {
  assistantList: any[];
  selectedAssistantIndex: number;
  selectedAssistantChangeHandler: (assistant: any, index: number) => void;
}

const ChooseVoiceAssistantType: React.FC<AssistantListProps> = ({
  assistantList,
  selectedAssistantIndex,
  selectedAssistantChangeHandler,
}) => {
  console.log("assistantList &*", assistantList);
  return (
    <>
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
      {assistantList.length > 0 ? (
        assistantList.map((assistant, index) => (
          <div
            className={
              selectedAssistantIndex === index
                ? "assistant-card selected-assistant"
                : "assistant-card "
            }
            key={index}
            onClick={() => {
              selectedAssistantChangeHandler(assistant, index);
            }}
          >
            <div className="card-image">
              <Image src={assistant.imageUrl} alt="" height={100} width={100} />
            </div>
            <div className="header-information">
              <div className="header_container">
                <h2 className="card_header">{assistant.assistantType}</h2>
                <div className="image-info">
                <Tooltip placement="bottomRight" title={assistant.info}>
                  <Image src={infoImage} alt="" height={100} width={100} />
                </Tooltip>
                </div>
              </div>
              <h3 className="card_sub-header">{assistant.dispcrtion}</h3>
            </div>
          </div>
        ))
      ) : (
        <div>loading....</div>
      )}
    </>
  );
};

export default ChooseVoiceAssistantType;
