import React, { useEffect, useState } from 'react';
import './integration.scss';
import Image from 'next/image';
import whatsAppIcon from '../../../../../../../public/svgs/whatsapp-icon.svg';
import telegramIcon from '../../../../../../../public/svgs/telegram-icon.svg';
import slackIcon from '../../../../../../../public/slack.png';
import WhatsappModal from '../Modal/WhatsappModal';
import { useCookies } from 'react-cookie';
import { Spin, message } from 'antd';
import { useRouter, useSearchParams } from 'next/navigation';
import SlackModal from '../Modal/SlackModal';
import TelegramModal from "../Modal/TelegramModal";
import { InfoCircleOutlined } from "@ant-design/icons";

function Integration() {
  //This state if for telegram modal open close
  const [isTelegramModalOpen, setIsTelegramModalOpen] = useState<boolean>(false);

  const [isWhatsappModalOpen, setisWhatsappModalOpen] =
    useState<boolean>(false);
  const [isWhatappVerified, setisWhatsappVerified] = useState<boolean>(false);
  const [isSlackModalOpen, setIsSlackModalOpen] = useState<boolean>(false);
  const [isSlackConnected, setIsSlackConnected] = useState<boolean>(false);
  const [loader, setLoader] = useState<boolean>(false);
  const[telegramLoader,setTelegramLoader]=useState<boolean>(false)
  const[isTelegramEdit,setIsTelegramEdit]=useState<boolean>(false)
  const params: any = useSearchParams();

  const chatbot = JSON.parse(decodeURIComponent(params.get("chatbot")));
  const userId = useCookies(["userId"]);
  const router = useRouter();

  const params: any = useSearchParams();

  const chatbot = JSON.parse(decodeURIComponent(params.get('chatbot')));

  const openWhatsAppModal = () => {
    setisWhatsappModalOpen(true);
  };
 
  const closeWhatsAppModal = () => {
    setisWhatsappModalOpen(false);
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
      if (
        data?.isWhatsappVerified === true ||
        data?.isWhatsappVerified === false
      ) {
        setisWhatsappVerified(data?.isWhatsappVerified);
      } else {
        message.error('unable to get whatsapp status');
      }
    } catch (error: any) {
      message.error('unable to get whatsapp status');
    }
    setLoader(false);
  };


  //This function will check where telegram is connected or not
  const fetchTelegramDetails = async () => {
    setTelegramLoader(true)
    try {
      const url = `${process.env.NEXT_PUBLIC_WEBSITE_URL}/chatbot/dashboard/telegram/telegramData/api?chatbotId=${chatbot.id}`;
      const response = await fetch(url, {
        headers: {
          cache: "no-store",
        },
        method: "GET",
        next: { revalidate: 0 },
      });
      const resp = await response.json();
      if (resp.status === 200) {
        setIsTelegramEdit(true)
      }
    } catch (error) {
      console.log("error", error);
    }
    setTelegramLoader(false)
  };

console.log('first',isTelegramEdit)
useEffect(() => {
  fetchTelegramDetails();
}, [isTelegramEdit]);

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
      {/* <div className="telegram-container" > */}
                   
      <div className="integration i-btn">
        <div className="name">
          <Image src={telegramIcon} alt="telegram-icon" />
          <span >Add to Telegram</span>
        </div>
        <div className='action' onClick={()=>{setIsTelegramModalOpen(true)}}>{telegramLoader ? <Spin/>: <>{isTelegramEdit?'Edit':'Connect'}</>}</div>
      <div className="telegram-i-btn" onClick={() => router.push(`dashboard/telegram-guide`)}><InfoCircleOutlined /></div>
      </div>

      <div className='integration'>
        <div className='name'>
          <Image src={slackIcon} alt='slack-icon' height={35} width={35} />
          <span>Add to Slack</span>
        </div>
        <>
          {loader ? (
            <Spin />
          ) : isSlackConnected ? (
            <>
              <div className='view' onClick={() => setIsSlackModalOpen(true)}>
                View
              </div>
            </>
          ) : (
            <>
              <div className='action' onClick={() => setIsSlackModalOpen(true)}>
                Connect
              </div>
            </>
          )}
        </>
      </div>
      {/* </div> */}

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
        isOpen={isWhatsappModalOpen}
        onClose={closeWhatsAppModal}
      />
      {/* ----------Telegram modal */}
      {isTelegramModalOpen && <TelegramModal setIsTelegramModalOpen={setIsTelegramModalOpen} isTelegramEdit={isTelegramEdit} setIsTelegramEdit={setIsTelegramEdit}/>}

      {/* Slack Modal */}
      <SlackModal
        isSlackModalOpen={isSlackModalOpen}
        setIsSlackModalOpen={setIsSlackModalOpen}
        userId={userId[0].userId}
        chatbotId={chatbot.id}
        setIsSlackConnected={setIsSlackConnected}
        isSlackConnected={isSlackConnected}
      />
    </div>
  );
}

export default Integration;
