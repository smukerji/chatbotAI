import React, { useEffect, useState } from 'react';
import './integration.scss';
import Image from 'next/image';
import whatsAppIcon from '../../../../../../../public/svgs/whatsapp-icon.svg';
import telegramIcon from '../../../../../../../public/svgs/telegram-icon.svg';
import WhatsappModal from '../Modal/WhatsappModal';
import { useRouter } from 'next/navigation';
import { Spin, message } from 'antd';
import { useCookies } from 'react-cookie';

function Integration() {
  const router = useRouter();
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] =
    useState<boolean>(false);
  const [isWhatappVerified, setIsWhatsAppVerified] = useState(false);

  const [loader, setLoader] = useState(false);
  const userId = useCookies(['userId']);

  const openWhatsAppModal = () => {
    setIsWhatsAppModalOpen(true);
  };

  const closeWhatsAppModal = () => {
    setIsWhatsAppModalOpen(false);
  };

  const checkWhatsappAvailability = async () => {
    setLoader(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_WEBSITE_URL}chatbot/dashboard/integrationApi/api?userId=${userId[0].userId}`,
        {
          method: 'GET',
          cache: 'no-cache',
          next: { revalidate: 0 },
        }
      );
      const data = await response.json();
      console.log(data);
      if (
        data?.isWhatsappVerified === true ||
        data?.isWhatsappVerified === false
      ) {
        setIsWhatsAppVerified(data?.isWhatsappVerified);
      } else {
        message.error('unable to get whatsapp status');
      }
    } catch (error: any) {
      message.error('unable to get whatsapp status');
    }
    setLoader(false);
  };

  useEffect(() => {
    checkWhatsappAvailability();
  }, []);
  return (
    <div className='integration-container'>
      {/*------------------------------------------Whatsapp-integration----------------------------------------------*/}
      <div className='integration'>
        <div className='name'>
          <Image src={whatsAppIcon} alt='whatsapp-icon' />
          <span>Add to Whatsapp</span>
        </div>
        <>
          {loader ? (
            <Spin />
          ) : (
            <>
              {isWhatappVerified ? (
                <div className='action' onClick={openWhatsAppModal}>
                  Connect
                </div>
              ) : (
                <div
                  className='action'
                  onClick={() => {
                    router.push(
                      `${process.env.NEXT_PUBLIC_WEBSITE_URL}home/pricing`
                    );
                  }}
                >
                  Subscription required
                </div>
              )}
            </>
          )}
        </>
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
