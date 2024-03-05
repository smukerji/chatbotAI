import { Modal, Switch, message } from "antd";
import { useSearchParams } from "next/navigation";
import React, { useEffect, useState } from "react";
import { useCookies } from "react-cookie";
import Image from "next/image";

import DeleteIcon from "../../../../../../../public/create-chatbot-svgs/delete-icon.svg";

function TelegramModal({ setIsTelegramModalOpen }: any) {
  /// fetch the params
  const params: any = useSearchParams();
  const chatbot = JSON.parse(decodeURIComponent(params.get("chatbot")));
  const userID = useCookies(["userId"]);

  // This is for active and inactive and delete btn
  const [status, setStatus] = useState<boolean>(false);

  //switch enable and dis-enabled
  const [switchEnabled, setSwitchEnabled] = useState<boolean>(true);

  const [telegramToken, setTelegramToken] = useState<any>();
  const [error, setError] = useState<any>({
    telegramToken: null,
  });

  const handleOk = () => {
    setIsTelegramModalOpen(false);
  };
  const handleCancel = () => {
    setIsTelegramModalOpen(false);
  };

  //This function is called when onChange event occurs in switch
  const onSwitchHandler=async()=>{
    setSwitchEnabled(!switchEnabled)
    try {
      const url = `${process.env.NEXT_PUBLIC_WEBSITE_URL}/chatbot/dashboard/telegram/telegramData/api`;
      const response = await fetch(url, {
        headers: {
          cache: "no-store",
        },
        method: "PUT",
        next: { revalidate: 0 },
        body:JSON.stringify({
          chatbotId:chatbot.id,
          isEnabled:!switchEnabled
        })
      });
      const resp = await response.json();
      if (resp.status === 200) {
       
       

        message.success(resp?.message);
      } else {
        message.error(resp?.message);
      }
    } catch (error) {

    }
  } 

  // This function is called when onChange event occurs in telegram input
  const inputChangeHandler = (e: any) => {
    if (e.target.value.trim() === "") {
      setError({ telegramToken: "please enter value" });
    } else {
      setError({ telegramToken: "" });
    }
    setTelegramToken(e.target.value);
  };
  // this function will delete token
  const deleteHandler = async () => {
    try {
      const url = `${process.env.NEXT_PUBLIC_WEBSITE_URL}/chatbot/dashboard/telegram/telegramData/api?chatbotId=${chatbot.id}`;
      const response = await fetch(url, {
        headers: {
          cache: "no-store",
        },
        method: "DELETE",
        next: { revalidate: 0 },
      });
      const resp = await response.json();
      if (resp.status === 200) {
        setStatus(false);
        setIsTelegramModalOpen(false);

        message.success(resp?.message);
      } else {
        message.error(resp?.message);
      }
    } catch (error) {}
  };

  const setTelegramData = async () => {
    try {
      const url = `${process.env.NEXT_PUBLIC_WEBSITE_URL}/chatbot/dashboard/telegram/telegramData/api`;
      const response = await fetch(url, {
        headers: {
          cache: "no-store",
        },
        method: "POST",
        next: { revalidate: 0 },
        body: JSON.stringify({
          chatbotId: chatbot.id,
          telegramToken: telegramToken,
          userId: userID[0].userId,
          isEnabled:true
        }),
      });
      const resp = await response.json();
      if (resp.status === 200) {
        message.success(resp?.message);
        setStatus(true);
      } else {
        message.error(resp?.message);
      }
    } catch (error) {
      console.log("error setting telegram data", error);
    }
  };

  //This function is called when user clicks on connect btn of telegram
  const onConnect = async () => {
    if (error?.telegramToken === "") {
      try {
        let url = `https://api.telegram.org/bot${telegramToken}/setWebhook?url=${process.env.NEXT_PUBLIC_NGROCKURL}/chatbot/dashboard/telegram/webhookTelegram/api?token=${telegramToken}`;
        const response = await fetch(url, {
          headers: {
            cache: "no-store",
          },
          method: "GET",
          next: { revalidate: 0 },
        });
        const resp = await response.json();
        if (resp.ok) {
          setTelegramData();

          // setIsTelegramModalOpen(false);
        } else {
          message.error("please check token and connect again");
        }
      } catch (error:any) {
        message.error('something went wrong please try again.. ')
        console.log("error from telegram", error);
      }
    } else {
      setError({ telegramToken: "please enter value" });
    }
  };

  //This function will get all telegram details

const fetchTelegramDetails=async()=>{
    try {
      const url = `${process.env.NEXT_PUBLIC_WEBSITE_URL}/chatbot/dashboard/telegram/telegramData/api?chatbotId=${chatbot.id}`;
      const response = await fetch(url,{
        headers: {
          cache: "no-store",
        },
        method: "GET",
        next: { revalidate: 0 },
      })
      const resp = await response.json()
      if(resp.status === 200){
        setTelegramToken(resp?.data?.telegramToken)
        setSwitchEnabled(resp?.data?.isEnabled) 
        setError({telegramToken:''})
      }
    } catch (error) {
      console.log("error",error)
    }
}

  useEffect(()=>{
    fetchTelegramDetails()
  },[])

  return (
    <div className="telegram-container">
      <Modal
        open={true}
        onOk={handleOk}
        footer={false}
        onCancel={handleCancel}
        className="telegram-modal"
      >
        {!status && (
          <>
            <div className="telegram-heading">Telegram Integration</div>
            <div className="telegram-token-container">
              <label className="telegram-label">Enter Telegram Token</label>
              <input
                value={telegramToken}
                type="text"
                className="telegram-input"
                placeholder="Enter your token from telegram "
                onChange={inputChangeHandler}
              />
              {error.telegramToken && (
                <p className="telegram-error">{error.telegramToken}</p>
              )}
            </div>
            <button className="telegram-button" onClick={onConnect}>
              connect
            </button>
          </>
        )}

        {/* ------------ This code for status----------- */}
        {status && (
          <>
          <div className="telegram-heading">Telegram Status</div>
            <div className="telegram-switch-delete-container">
              <div className="telegram-switch-container">
                {switchEnabled ? "Active" : "In-active"}
                <Switch
                  checked={switchEnabled}
                  onChange={onSwitchHandler}
                />
              </div>
              <Image
                src={DeleteIcon}
                alt="delete-icon"
                onClick={deleteHandler}
                className="telegram-delete"
              />
            </div>
          </>
        )}
      </Modal>
    </div>
  );
}

export default TelegramModal;
