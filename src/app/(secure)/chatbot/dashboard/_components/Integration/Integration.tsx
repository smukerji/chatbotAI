import React, { useState } from "react";
import "./integration.scss";
import Image from "next/image";
import whatsAppIcon from "../../../../../../../public/svgs/whatsapp-icon.svg";
import telegramIcon from "../../../../../../../public/svgs/telegram-icon.svg";
import WhatsappModal from "../Modal/WhatsappModal";

function Integration() {
  const [isWhatsappModalOpen, setisWhatsappModalOpen] = useState<boolean>(false);

  const openWhatsAppModal = () => {
    setisWhatsappModalOpen(true);
  };

  const closeWhatsAppModal = () => {
    setisWhatsappModalOpen(false);
  };
  return (
    <div className="integration-container">
      {/*------------------------------------------Whatsapp-integration----------------------------------------------*/}
      <div className="integration">
        <div className="name">
          <Image src={whatsAppIcon} alt="whatsapp-icon" />
          <span>Add to Whatsapp</span>
        </div>
        <div className="action" onClick={openWhatsAppModal}>Subscription required</div>
      </div>

      {/*------------------------------------------Telegram-integration----------------------------------------------*/}
      <div className="integration">
        <div className="name">
          <Image src={telegramIcon} alt="telegram-icon" />
          <span>Add to Telegram</span>
        </div>
        <div className="action">Coming soon</div>
      </div>

          {/* Whatsapp Modal */}
          <WhatsappModal isOpen={isWhatsappModalOpen} onClose={closeWhatsAppModal} />
    </div>
  );
}

export default Integration;
