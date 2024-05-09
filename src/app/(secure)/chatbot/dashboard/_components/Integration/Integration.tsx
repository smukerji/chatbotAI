import React, { useEffect, useState } from "react";
import "./integration.scss";
import Image from "next/image";
import whatsAppIcon from "../../../../../../../public/svgs/whatsapp-icon.svg";
import telegramIcon from "../../../../../../../public/telegram.svg";
import slackIcon from "../../../../../../../public/Slack_icon_2019.svg";
import WhatsappModal from "../Modal/WhatsappModal";
import { useCookies } from "react-cookie";
import { Spin, message } from "antd";
import { useRouter, useSearchParams } from "next/navigation";
import SlackModal from "../Modal/SlackModal";
import TelegramModal from "../Modal/TelegramModal";
import { EditOutlined, InfoCircleOutlined } from "@ant-design/icons";
import editIcon from "../../../../../../../public/sections-images/common/edit.svg";
import viewIcon from "../../../../../../../public/eye-close-svgrepo-com.svg";
import CustomModal from "../CustomModal/CustomModal";

function Integration({ isPlanNotification, setIsPlanNotification }: any) {
  //This state if for telegram modal open close
  const [isTelegramModalOpen, setIsTelegramModalOpen] =
    useState<boolean>(false);

  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] =
    useState<boolean>(false);
  const [isWhatappVerified, setIsWhatsAppVerified] = useState<boolean>(false);
  const [whatsappConnectbtn, setWhatsappConnectbtn] = useState<boolean>(false);
  const [onEditClicked, setOnEditClicked] = useState<boolean>(false);
  const [isSlackModalOpen, setIsSlackModalOpen] = useState<boolean>(false);
  const [isSlackConnected, setIsSlackConnected] = useState<boolean>(false);
  const [loader, setLoader] = useState<boolean>(false);
  const [telegramLoader, setTelegramLoader] = useState<boolean>(false);
  const [isTelegramEdit, setIsTelegramEdit] = useState<boolean>(false);
  const [isTelegramVerified, setIsTelegramVerified] = useState<boolean>(false);

  //This state is for checking if telegram is connected
  const [isTelegramConnected, setIsTelegramConnected] =
    useState<boolean>(false);
  const params: any = useSearchParams();

  const chatbot = JSON.parse(decodeURIComponent(params.get("chatbot")));
  const userId = useCookies(["userId"]);
  const router = useRouter();

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
          method: "GET",
          cache: "no-cache",
          next: { revalidate: 0 },
        }
      );
      const data = await response.json();
      if (
        data?.isWhatsappVerified === true ||
        data?.isWhatsappVerified === false
      ) {
        setIsWhatsAppVerified(data?.isWhatsappVerified);
      } else {
        message.error("unable to get whatsapp status");
      }
    } catch (error: any) {
      message.error("unable to get whatsapp status");
    }
    setLoader(false);
  };
  //This function will check if telegram is available or not
  const checkTelegramAvailability = async () => {
    setTelegramLoader(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_WEBSITE_URL}chatbot/dashboard/integrationApiTelegram/api?userId=${userId[0].userId}`,
        {
          method: "GET",
          cache: "no-cache",
          next: { revalidate: 0 },
        }
      );
      const data = await response.json();
      if (
        data?.isTelegramVerified === true ||
        data?.isTelegramVerified === false
      ) {
        setIsTelegramVerified(data?.isTelegramVerified);
      } else {
        message.error("unable to get Telegram status");
      }
    } catch (error: any) {
      message.error("unable to get Telegram status");
    }
    setTelegramLoader(false);
  };

  //This function will check where telegram is connected or not
  const fetchTelegramDetails = async () => {
    setTelegramLoader(true);
    try {
      const url = `${process.env.NEXT_PUBLIC_WEBSITE_URL}chatbot/dashboard/telegram/telegramData/api?chatbotId=${chatbot.id}`;
      const response = await fetch(url, {
        headers: {
          cache: "no-store",
        },
        method: "GET",
        next: { revalidate: 0 },
      });
      const resp = await response.json();
      if (resp.status === 200) {
        setIsTelegramEdit(true);
        setIsTelegramConnected(true);
      }
    } catch (error) {
      console.log("error", error);
    }
    setTelegramLoader(false);
  };
  // This is for fetching values if present
  const fetchWhatsappDetails = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_WEBSITE_URL}/chatbot/dashboard/whatsapp/account?chatBotId=${chatbot.id}`,
        {
          headers: {
            cache: "no-store",
          },
          method: "GET",
          next: { revalidate: 0 },
        }
      );
      const data = await response.json();
      if (data?.phoneBusinessID) {
        setWhatsappConnectbtn(true);
      }
      // console.log('data',data.phoneBusinessID)
    } catch (error) {
      message.error("error getting data");
    }
  };
  //This function is called when edit btn is clicked
  const onEditHandler = () => {
    openWhatsAppModal();
    setOnEditClicked(true);
  };

  useEffect(() => {
    checkTelegramAvailability();
    fetchTelegramDetails();
  }, [isTelegramEdit]);

  useEffect(() => {
    checkWhatsappAvailability();
    fetchWhatsappDetails();
  }, []);

  return (
    <div className="integration-container">
      <CustomModal
        open={isPlanNotification}
        setOpen={setIsPlanNotification}
        header={"Upgrade Now to create new Chatbots!"}
        content={"Upgrade now to access your chatbots!"}
        footer={
          <button
            onClick={() => {
              router.push("/home/pricing");
            }}
          >
            Upgrade Now
          </button>
        }
      />
      {/*------------------------------------------Whatsapp-integration----------------------------------------------*/}
      <div
        className="integration i-btn"
        style={{ zIndex: isPlanNotification ? -1 : 0 }}
      >
        <div className="name">
          <Image src={whatsAppIcon} alt="whatsapp-icon" />
          <span>Add to Whatsapp</span>
          {whatsappConnectbtn && (
            <Image
              src={editIcon}
              alt="edit"
              onClick={onEditHandler}
              className="whatsapp-edit-icon-s"
            />
          )}
        </div>
        <>
          {loader ? (
            <Spin style={{ opacity: isPlanNotification ? 0 : 1 }} />
          ) : (
            <>
              {isWhatappVerified ? (
                <>
                  {whatsappConnectbtn ? (
                    <div className="action">Connected</div>
                  ) : (
                    <div className="action" onClick={openWhatsAppModal}>
                      Connect
                    </div>
                  )}
                </>
              ) : (
                <div
                  className="action"
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
        <div
          // style={{ position: isPlanNotification ? "unset" : "relative" }}
          className="telegram-i-btn"
          onClick={() => router.push(`dashboard/whatsapp-integration-guide`)}
        >
          <InfoCircleOutlined />
        </div>
      </div>

      {/*------------------------------------------Telegram-integration----------------------------------------------*/}
      {/* <div className="telegram-container" > */}

      <div
        className="integration i-btn"
        style={{ zIndex: isPlanNotification ? -1 : 0 }}
      >
        <div className="name">
          <Image
            className="telegram-img"
            src={telegramIcon}
            alt="telegram-icon"
          />
          <span>Add to Telegram</span>
          {isTelegramEdit && (
            <Image
              src={editIcon}
              alt="edit"
              className="telegram-edit-icon-s"
              onClick={() => {
                setIsTelegramModalOpen(true);
              }}
            />
          )}
        </div>
        <div className="telegram-action">
          {telegramLoader ? (
            <Spin style={{ opacity: isPlanNotification ? 0 : 1 }} />
          ) : (
            <>
              {isTelegramVerified ? (
                <>
                  {isTelegramEdit ? (
                    "Connected"
                  ) : (
                    <div
                      onClick={() => {
                        setIsTelegramModalOpen(true);
                      }}
                    >
                      Connect
                    </div>
                  )}
                </>
              ) : (
                <div
                  className="telegram-action"
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
        </div>
        <div
          // style={{ position: isPlanNotification ? "unset" : "relative" }}
          className="telegram-i-btn"
          onClick={() => router.push(`dashboard/telegram-guide`)}
        >
          <InfoCircleOutlined />
        </div>
      </div>
      {/* -----------------------------------------Slack-integration------------------------------------------------------------- */}
      <div className="integration">
        <div className="name">
          <Image src={slackIcon} alt="slack-icon" height={35} width={35} />
          <span>Add to Slack</span>
          {isSlackConnected && (
            <Image
              src={viewIcon}
              alt="edit"
              className="slack-edit-icon"
              onClick={() => setIsSlackModalOpen(true)}
            />
          )}
        </div>
        <>
          {isSlackConnected ? (
            <>
              <div className="view">Connected</div>
            </>
          ) : (
            <>
              <div className="action" onClick={() => setIsSlackModalOpen(true)}>
                Connect
              </div>
            </>
          )}
        </>
      </div>
      {/* </div> */}

      <div className="how-to-integrate">
        <p
          className="integrate-text"
          onClick={() => router.push(`dashboard/whatsapp-integration-guide`)}
        >
          How to integrate my Chatbot?
        </p>
      </div>

      {/* Whatsapp Modal */}
      <WhatsappModal
        isOpen={isWhatsAppModalOpen}
        onClose={closeWhatsAppModal}
        onEditClicked={onEditClicked}
        setOnEditClicked={setOnEditClicked}
        setWhatsappConnectbtn={setWhatsappConnectbtn}
      />
      {/* ----------Telegram modal */}
      {isTelegramModalOpen && (
        <TelegramModal
          setIsTelegramModalOpen={setIsTelegramModalOpen}
          isTelegramEdit={isTelegramEdit}
          setIsTelegramEdit={setIsTelegramEdit}
          setIsTelegramConnected={setIsTelegramConnected}
        />
      )}

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
