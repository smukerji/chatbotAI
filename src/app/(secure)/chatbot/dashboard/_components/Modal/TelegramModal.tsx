import { Button, Modal, Switch, message } from "antd";
import { useSearchParams } from "next/navigation";
import React, { useEffect, useState } from "react";
import { useCookies } from "react-cookie";
import Image from "next/image";

import DeleteIcon from "../../../../../../../public/create-chatbot-svgs/delete-icon.svg";
import EditIcon from "../../../../../../../public/sections-images/common/edit.svg";
import axios from "axios";
import { EditOutlined } from "@ant-design/icons";

function TelegramModal({ setIsTelegramModalOpen,isTelegramEdit,setIsTelegramEdit }: any) {
  /// fetch the params
  const params: any = useSearchParams();
  const chatbot = JSON.parse(decodeURIComponent(params.get("chatbot")));
  const userID = useCookies(["userId"]);

  //chat-bot name in telegram
  const [botName, setBotName] = useState<string>("");

  //chat-bot name from telegram-api
  const[botNameFromTelegram,setBotNameFromTelegram]=useState<string>()

  //For toggle
  const [editName, setEditName] = useState<boolean>(false);

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
  const onSwitchHandler = async () => {
    setSwitchEnabled(!switchEnabled);
    try {
      const url = `${process.env.NEXT_PUBLIC_WEBSITE_URL}/chatbot/dashboard/telegram/telegramData/api`;
      const response = await fetch(url, {
        headers: {
          cache: "no-store",
        },
        method: "PUT",
        next: { revalidate: 0 },
        body: JSON.stringify({
          chatbotId: chatbot.id,
          isEnabled: !switchEnabled,
        }),
      });
      const resp = await response.json();
      if (resp.status === 200) {
        message.success(resp?.message);
      } else {
        message.error(resp?.message);
      }
    } catch (error) {}
  };

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
        setIsTelegramEdit(false)
        setStatus(false);
        setIsTelegramModalOpen(false);
        
        message.success(resp?.message);
      } else {
        message.error(resp?.message);
      }
    } catch (error) {}
  };

  //This function will get bot name from telegram
  const getBotName = async (token:any) => {
    const newToken = token !== ''? token : telegramToken
    try {
      let url = `https://api.telegram.org/bot${newToken}/getMyName`;
      const response = await fetch(url, {
        headers: {
          cache: "no-store",
        },
        method: "GET",
        next: { revalidate: 0 },
      });
      const resp = await response.json();
      if (resp?.result?.name) {
        setBotName(resp?.result?.name);
        setBotNameFromTelegram(resp?.result?.name)
        setStatus(true);
      } else {
        message.error("something went wrong please try again..");
      }
    } catch (error) {
      console.log("error getting name from telegram");
    }
  };

  //This function is for onchange of telegram bot name
  const telegramBotNameInputhandler = (e: any) => {
    setBotName(e.target.value);
  };

  //This function is for changing name of bot
  const handleNameChange = async () => {
    
    if(botName.trim() === ''){
      message.error('botName should not be empty')
      return
    }
    if(botName === botNameFromTelegram){
      message.error('please type some different value')
      return
    }
    
    const body = {
      name: botName,
    };

    axios
      .post(`https://api.telegram.org/bot${telegramToken}/setMyName`, body)
      .then((res: any) => {

        if (res?.data?.ok) {
          message.success("Bot name changed successfully");
          setEditName(false);
        } else {
          message.error(res?.data?.description);
        }
      })
      .catch((error) => {
        const description = error?.response?.data?.description;
        if (description && error?.response?.data?.parameters?.retry_after) {

          const retryAfterSeconds =  error?.response?.data?.parameters?.retry_after;

          const hours = Math.floor(retryAfterSeconds / 3600);
          const minutes = Math.floor((retryAfterSeconds % 3600) / 60);
          if(retryAfterSeconds<60){
            message.error(`Too Many Requests. Please try after ${retryAfterSeconds}seconds`);

          }
          else{

            message.error(`Too Many Requests. Please try after ${hours} hours and ${minutes} minutes`);
          }
        } else {
          // Handle other errors using the original message.error
          message.error(description);
        }
      });
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
          isEnabled: true,
        }),
      });
      const resp = await response.json();
      if (resp.status === 200) {
        setIsTelegramEdit(true)
        getBotName('');
        message.success(resp?.message);
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
        let url = `https://api.telegram.org/bot${telegramToken}/setWebhook?url=${process.env.NEXT_PUBLIC_WEBSITE_URL}/chatbot/dashboard/telegram/webhookTelegram/api?token=${telegramToken}`;
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
      } catch (error: any) {
        message.error("something went wrong please try again.. ");
        console.log("error from telegram", error);
      }
    } else {
      setError({ telegramToken: "please enter value" });
    }
  };

  //This function will get all telegram details

  const fetchTelegramDetails = async () => {
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
        setTelegramToken(resp?.data?.telegramToken);
        setSwitchEnabled(resp?.data?.isEnabled);
        getBotName(resp?.data?.telegramToken)
        setError({ telegramToken: "" });
      }
    } catch (error) {
      console.log("error", error);
    }
  };

  useEffect(() => {
    fetchTelegramDetails();
    if(isTelegramEdit){
      setStatus(true)
    }
  }, []);

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
                <div className="telegram-bot-name">
                  {editName ? (
                    <div className="telegram-input-save">
                      <input
                        className="telegram-bot-name-input"
                        value={botName}
                        onChange={telegramBotNameInputhandler}
                      />
                      <button
                        className="telegram-button-save"
                        onClick={handleNameChange}
                      >
                        Save
                      </button>
                    </div>
                  ) : (
                    <div className="telegram-botname-edit">
                      <div className="telegram-bot-name">{botName}</div>
                      {/* <Image
                        src={EditIcon}
                        alt="edit-icon"
                        onClick={() => setEditName(true)}
                      /> */}
                      <EditOutlined onClick={() => setEditName(true)}/>
                    </div>
                  )}
                </div>
              </div>
              <div className="telegram-switch-delete">
                <div className="telegram-active-inactive">{switchEnabled ? "Active" : "In-active"}</div>{" "}
                <Switch checked={switchEnabled} onChange={onSwitchHandler} />
                <Image
                  src={DeleteIcon}
                  alt="delete-icon"
                  onClick={deleteHandler}
                  className="telegram-delete"
                />
              </div>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
}

export default TelegramModal;
