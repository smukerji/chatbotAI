import React from 'react';
import Image from 'next/image';

import infoImage from "../../../../../../public/voiceBot/SVG/info-circle.svg";

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
  return (
    <>
      {assistantList.length > 0 ? (
        assistantList.map((assistant, index) => (
          <div
            className={
              selectedAssistantIndex === index
                ? 'assistant-card selected-assistant'
                : 'assistant-card '
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
                  <Image src={infoImage} alt="" height={100} width={100} />
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