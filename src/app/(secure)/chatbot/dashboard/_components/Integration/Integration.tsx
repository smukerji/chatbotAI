import React, { useState } from 'react';
import './integration.scss';
import Image from 'next/image';
import whatsAppIcon from '../../../../../../../public/svgs/whatsapp-icon.svg';
import telegramIcon from '../../../../../../../public/svgs/telegram-icon.svg';
import WhatsappModal from '../Modal/WhatsappModal';
import { useRouter } from 'next/navigation';

function Integration() {
  const router = useRouter();
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] =
    useState<boolean>(false);

  const openWhatsAppModal = () => {
    setIsWhatsAppModalOpen(true);
  };

  const closeWhatsAppModal = () => {
    setIsWhatsAppModalOpen(false);
  };
  return (
    <div className='integration-container'>
      {/*------------------------------------------Whatsapp-integration----------------------------------------------*/}
      <div className='integration'>
        <div className='name'>
          <Image src={whatsAppIcon} alt='whatsapp-icon' />
          <span>Add to Whatsapp</span>
        </div>
        <div className='action' onClick={openWhatsAppModal}>
          Subscription required
        </div>
      </div>

      {/*------------------------------------------Telegram-integration----------------------------------------------*/}
      <div className='integration'>
        <div className='name'>
          <Image src={telegramIcon} alt='telegram-icon' />
          <span>Add to Telegram</span>
        </div>
        <div className='action'>Coming soon</div>
      </div>

      <div className='how-to-integrate'>
        <p
          className='integrate-text'
          onClick={() => router.push(`dashboard/whatsapp-integration-guide`)}
        >
          How to integrate my Chatbot?
        </p>
      </div>

      {/* Whatsapp Modal */}
      <WhatsappModal
        isOpen={isWhatsAppModalOpen}
        onClose={closeWhatsAppModal}
      />
    </div>
  );
}

export default Integration;
