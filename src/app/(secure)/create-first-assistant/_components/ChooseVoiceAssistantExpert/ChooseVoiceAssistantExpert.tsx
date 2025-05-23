import React, { useContext } from 'react';
import Image from 'next/image';
// import infoImage from "../../../../public/voiceBot/SVG/info-circle.svg";
import infoImage from "../../../../../../public/voiceBot/SVG/info-circle.svg";
import { CreateVoiceBotContext } from '@/app/_helpers/client/Context/VoiceBotContextApi';
import customTemplate from "../../../../../../public/voiceBot/SVG/profile-circle.svg";
import { Tooltip } from 'antd';

interface IndustryExpertListProps {
  industryExpertList: any[];
  selecteExpertIndex: number;
  selectedExpertChangeHandler: (assistant: any, index: number) => void;
}

const ChooseVoiceAssistantExpert: React.FC<IndustryExpertListProps> = ({
  industryExpertList,
  selecteExpertIndex,
  selectedExpertChangeHandler,
}) => {

    const voiceBotContextData: any = useContext(CreateVoiceBotContext);
    const voiceBotContext = voiceBotContextData.voiceBotContext;
    
    console.log(voiceBotContext);
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
      {industryExpertList.map((assistant, index) => (
        <div
          className={
            selecteExpertIndex === index
              ? 'assistant-card selected-assistant'
              : 'assistant-card '
          }
          key={index}
          onClick={() => {
            selectedExpertChangeHandler(assistant, index);
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
      ))}
    </>
  );
};

export default ChooseVoiceAssistantExpert;