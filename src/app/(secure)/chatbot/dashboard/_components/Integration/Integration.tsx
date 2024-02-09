import React, { useState } from "react";
import "./integration.scss";
import Image from "next/image";
import whatsAppIcon from "../../../../../../../public/svgs/whatsapp-icon.svg";
import telegramIcon from "../../../../../../../public/svgs/telegram-icon.svg";
import HubspotModal from "../Modal/HubspotModal";
import hubspotIcon from '../../../../../../../public/create-chatbot-svgs/Hubspot.svg';

function Integration({chatbotId}:any) {
  const [isHubspotModalOpen, setIsHubspotModalOpen] = useState<boolean>(false); // State to control visibility of HubspotModal

// function Integration() {
  return (
    <div className="integration-container">
      {/*------------------------------------------Whatsapp-integration----------------------------------------------*/}
      <div className="integration">
        <div className="name">
          <Image src={whatsAppIcon} alt="whatsapp-icon" />
          <span>Add to Whatsapp</span>
        </div>
        <div className="action">Subscription required</div>
      </div>

      {/*------------------------------------------Telegram-integration----------------------------------------------*/}
      <div className="integration">
        <div className="name">
          <Image src={telegramIcon} alt="telegram-icon" />
          <span>Add to Telegram</span>
        </div>
        <div className="action">Coming soon</div>
      </div>
      <div className="integration"  >
        <div className="name">
          <Image src={hubspotIcon} alt="telegram-icon" />
          <span>Add to Hubspot</span>
        </div>
        <button className="action-btn" onClick={() => setIsHubspotModalOpen(true)}>Connect</button>
      </div>

        {/* Render HubspotModal if isHubspotModalOpen is true */}
        {isHubspotModalOpen && (
        <HubspotModal
        chatbotId={chatbotId}
          isModalOpen={isHubspotModalOpen}
          setIsModalOpen={setIsHubspotModalOpen}
        />
      )}
    </div>
  );
}

export default Integration;
