import React, { useContext } from 'react';
import Image from 'next/image';
// import infoImage from "../../../../public/voiceBot/SVG/info-circle.svg";
import infoImage from "../../../../../../public/voiceBot/SVG/info-circle.svg";
import { CreateVoiceBotContext } from '@/app/_helpers/client/Context/VoiceBotContextApi';

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
    debugger;
    console.log(voiceBotContext);
  return (
    <>
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
                <Image src={infoImage} alt="" height={100} width={100} />
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