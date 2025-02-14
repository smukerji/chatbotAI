// filepath: c:\Live-Projects\Torri-AI\chatbotAI\src\app\(secure)\chatbot\_components\VoicebotTableLayout.tsx
import "./voicebottable.scss";
import React from 'react';
import Image from 'next/image';
// import voiceAssistantPreview from '../../../../public/voiceBot/voice-bot-preview.svg';
import voiceAssistantPreview from "../../../../../public/sections-images/common/chatbot-bg-img.svg";
const VoicebotTableLayout = ({ voiceAssistantList, selectedAssistantHandler, getDate }: any) => {
  return (
    <div className="voicebot-table-container">
      <table className="voicebot-table">
        <thead>
          <tr>
            <th>Voicebot Name</th>
            <th>Number of Calls</th>
            <th>Last Used</th>
            <th>Last Trained</th>
          </tr>
        </thead>
        <tbody>
          {voiceAssistantList.map((assistant: any, index: number) => (
            <tr key={index} onClick={() => selectedAssistantHandler(assistant)}>
              <td>
                <div className="assistant-info">
                  <Image alt="assistant image" src={voiceAssistantPreview} width={50} height={50} />
                  <span>{assistant.assistantName}</span>
                </div>
              </td>
              <td>{assistant?.metadata?.totalCallLogs || 0}</td>
              <td>{getDate(assistant?.metadata?.lastUsed) || 0}</td>
              <td>{getDate(assistant?.metadata?.lastTrained) || 0}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default VoicebotTableLayout;