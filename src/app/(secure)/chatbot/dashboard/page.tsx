"use client";
import { Button, Modal, Radio, RadioChangeEvent } from "antd";
import { redirect, useSearchParams } from "next/navigation";
import React, { useContext, useEffect, useState } from "react";
import "./dashboard.scss";
import Chat from "./_components/Chat/Chat";
import DeleteModal from "./_components/Modal/DeleteModal";
import { useCookies } from "react-cookie";
import Home from "../../home/page";
import { useSession } from "next-auth/react";
import dynamic from "next/dynamic";
import { v4 as uuid } from "uuid";
import Settings from "./_components/Settings/Settings";
import { getDate, getTime } from "../../../_helpers/client/getTime";
import Image from "next/image";

import arrowIcon from "../../../../../public/svgs/Feather Icon.svg";
import { CreateBotContext } from "../../../_helpers/client/Context/CreateBotContext";
import History from "./_components/History/History";
import EmbedSite from "./_components/EmbedSite/EmbedSite";
import Integration from "./_components/Integration/Integration";
import { ChatbotSettingContext } from "../../../_helpers/client/Context/ChatbotSettingContext";
import { JWT_EXPIRED } from "../../../_helpers/errorConstants";
import axios from "axios";
import Leads from "./_components/Leads/Leads";

function Dashboard() {
  const { status } = useSession();

  /// get the bot context
  const botContext: any = useContext(CreateBotContext);
  const botDetails = botContext?.createBotInfo;

  /// get the bot setting context
  const chatbotSettingContext: any = useContext(ChatbotSettingContext);
  const chatbotSettings = chatbotSettingContext?.chatbotSettings;

  /// check which action is active
  const editChatbot = botDetails?.editChatbot;

  /// fetch the params
  const params: any = useSearchParams();
  const chatbot = JSON.parse(decodeURIComponent(params.get("chatbot")));

  const editChatbotSource = params.get("editChatbotSource") ?? "chatbot";

  const [cookies, setCookies] = useCookies(["userId"]);

  /// hadling event of radio buttons
  const [source, setSource] = useState("chatbot");
  const onChange = (e: RadioChangeEvent) => {
    if (e.target.value != "delete") setSource(e.target.value);
  };

  /// messages
  const [messages, setMessages]: any = useState([]);

  // console.log(chatbotSettings);

  const [messagesTime, setMessagesTime]: any = useState([]);

  /// data sources state
  const [qaData, setQaData]: any = useState();
  const [textData, setTextData]: any = useState();
  const [fileData, setFileData]: any = useState();
  const [crawlData, setCrawlData]: any = useState();
  // const [qaCharCount, setQACharCount] = useState(0);

  /// sesstion Id and date for current chat window
  const [sessionID, setSessionID]: any = useState();
  const [sessionStartDate, setSessionStartDate]: any = useState();

  const [isPlanNotification, setIsPlanNotification] = useState(false);
  const [user, setUser] = useState<any>(null);

  const getUser = async () => {
    const response = await axios.get(
      `${process.env.NEXT_PUBLIC_WEBSITE_URL}api/user?userId=${cookies.userId}`
    );

    setUser(response.data.user);
  };

  useEffect(() => {
    const planEndTimer = setInterval(() => {
      if (user) {
        const planEndDate = new Date(user?.endDate);

        if (new Date() > planEndDate) {
          setIsPlanNotification(true);

          // setSource("history");
        }
      }
    }, 1000);

    return () => clearInterval(planEndTimer);
  }, [user]);

  // useEffect(() => {
  //   if (isPlanNotification) botContext?.handleChange("editChatbot")("history");
  // }, [isPlanNotification]);

  useEffect(() => {
    setSessionID(uuid());
    setSessionStartDate(getDate());
  }, []);

  /// managing delete chatbot
  const [open, setOpen] = useState(false);
  const showModal = () => {
    setOpen(true);
  };

  useEffect(() => {
    botContext?.handleChange("editChatbot")(editChatbotSource);
    getUser();
    const fetchData = async () => {
      try {
        setLoading(true);
        botContext.handleChange("chatbotName")(chatbot?.name);

        /// get chatbot details
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_WEBSITE_URL}chatbot/dashboard/api`,
          {
            method: "POST",
            body: JSON.stringify({
              chatbotId: chatbot.id,
              userId: cookies.userId,
            }),
            next: { revalidate: 0 },
          }
        );
        const content = await response.json();

        /// check if session is expired
        if (content.message == JWT_EXPIRED) {
          window.location.href = "/account/login";
        }

        /// set all the chatbot setting
        chatbotSettingContext?.loadData(content?.chatbotSetting);
        content?.chatbotSetting?.initialMessage?.map(
          (message: string, index: number) => {
            // setMessages((prev): any => {
            //   [
            //     ...prev,
            //     {
            //       role: "assistant",
            //       content: message,
            //     },
            //   ];
            // });
            setMessages((prevMessages: any) => [
              ...prevMessages,
              {
                role: "assistant",
                content: message,
              },
            ]);

            setMessagesTime((prevMessages: any) => [
              ...prevMessages,
              {
                role: "assistant",
                content: message,
                messageTime: getDate(),
                messageType: "initial",
              },
            ]);
          }
        );

        /// total characters count
        // const tempQaCharCount = qaData ? qaData.qaCharCount : 0;
        // const tempTextCharCount = textData ? textData.textLength : 0;
        // const tempFileTextCount = fileData ? fileData.fileTextLength : 0;
        // const tempCrawlDataCount = crawlingData
        //   ? crawlingData?.crawledDataLength
        //   : 0;

        /// total characters count
        botContext.handleChange("totalCharCount")(
          content.qaCharCount +
            content.textLength +
            content.fileTextLength +
            content.crawlDataLength
        );

        botContext.handleChange("chatbotName")(content?.chatbotName);

        /// set the default state for loading the data in home
        setQaData({
          qaList: content.qaList,
          qaCount: content.qaCount,
          qaCharCount: content.qaCharCount,
        });
        setTextData({
          text: content.text,
          textLength: content.textLength,
        });
        setFileData({
          defaultFileList: content.defaultFileList,
          fileTextLength: content.fileTextLength,
        });
        setCrawlData({
          crawledData: content.crawlData,
          crawledDataLength: content.crawlDataLength,
        });
        setLoading(false);
      } catch (error) {
        setLoading(false);
        console.error("Error retriving chatbot details:", error);
      }
    };

    fetchData();
  }, []);

  const [loading, setLoading] = useState(false);

  if (status === "authenticated" || cookies?.userId) {
    return (
      <div className="edit-chatbot-container">
        {/*------------------------------------------top-section----------------------------------------------*/}
        <div className="top">
          {/*------------------------------------------header----------------------------------------------*/}
          <div className="sources-header">
            <div className="title">
              <Image
                src={arrowIcon}
                alt="arrow-icon"
                style={{ transform: "rotate(180deg)", cursor: "pointer" }}
                onClick={() => {
                  botContext?.resetCreateBotInfo();
                  chatbotSettingContext?.resetChatbotSettings();
                  window.history.back();
                }}
              />
              {/* <h1>{chatbot?.name}</h1> */}
              <h1>{botDetails?.chatbotName}</h1>
            </div>

            {/*------------------------------------------options-container----------------------------------------------*/}
            <ul className="options-container">
              <li
                className={`${editChatbot === "chatbot" ? "active" : ""}`}
                value={"chatbot"}
                onClick={() =>
                  botContext?.handleChange("editChatbot")("chatbot")
                }
              >
                <h3 className="option">chatbot</h3>
              </li>
              <li
                className={`${editChatbot === "settings" ? "active" : ""}`}
                value={"settings"}
                onClick={() =>
                  botContext?.handleChange("editChatbot")("settings")
                }
              >
                <h3 className="option">settings</h3>
              </li>
              <li
                className={`${editChatbot === "sources" ? "active" : ""}`}
                value={"sources"}
                onClick={() => {
                  // fetchData();
                  botContext?.handleChange("editChatbot")("sources");
                }}
              >
                <h3 className="option">data sources</h3>
              </li>
              <li
                className={`${editChatbot === "integrations" ? "active" : ""}`}
                value={"integrations"}
                onClick={() =>
                  botContext?.handleChange("editChatbot")("integrations")
                }
              >
                <h3 className="option">Integrations</h3>
              </li>
              <li
                className={`${editChatbot === "embedSite" ? "active" : ""}`}
                value={"embedSite"}
                onClick={() =>
                  botContext?.handleChange("editChatbot")("embedSite")
                }
              >
                <h3 className="option">Embed on site</h3>
              </li>

              <li
                className={`${editChatbot === "history" ? "active" : ""}`}
                value={"history"}
                onClick={() =>
                  botContext?.handleChange("editChatbot")("history")
                }
              >
                <h3 className="option">Conversation History</h3>
              </li>

              <li
                className={`${editChatbot === "leads" ? "active" : ""}`}
                value={"leads"}
                onClick={() => botContext?.handleChange("editChatbot")("leads")}
              >
                <h3 className="option">Leads</h3>
              </li>
            </ul>

            <hr />
          </div>
        </div>

        <div className="bottom">
          {/*------------------------------------------chatbot-component----------------------------------------------*/}
          {editChatbot == "chatbot" && (
            <>
              <Chat
                chatbot={chatbot}
                messages={messages}
                setMessages={setMessages}
                messagesTime={messagesTime}
                setMessagesTime={setMessagesTime}
                sessionID={sessionID}
                sessionStartDate={sessionStartDate}
                setSessionID={setSessionID}
                setSessionStartDate={setSessionStartDate}
                isPlanNotification={isPlanNotification}
                setIsPlanNotification={setIsPlanNotification}
              />
            </>
          )}
          {/*------------------------------------------settings-component----------------------------------------------*/}
          {editChatbot == "settings" && (
            <>
              <Settings
                chatbotId={chatbot.id}
                chatbotName={botDetails?.chatbotName}
                isPlanNotification={isPlanNotification}
                setIsPlanNotification={setIsPlanNotification}
              />
            </>
          )}

          {/*------------------------------------------sources-component----------------------------------------------*/}
          {editChatbot == "sources" && !loading && (
            <>
              <Home
                updateChatbot="true"
                qaData={qaData}
                textData={textData}
                fileData={fileData}
                crawlingData={crawlData}
                chatbotId={chatbot.id}
                chatbotName={chatbot.name}
                isPlanNotification={isPlanNotification}
                setIsPlanNotification={setIsPlanNotification}
              />
            </>
          )}

          {/*------------------------------------------integrations-component----------------------------------------------*/}
          {editChatbot == "integrations" && !loading && (
            <>
              <Integration
                isPlanNotification={isPlanNotification}
                setIsPlanNotification={setIsPlanNotification}
              />
            </>
          )}

          {/*------------------------------------------embed-on-site-component----------------------------------------------*/}
          {editChatbot == "embedSite" && !loading && (
            <>
              <EmbedSite
                chatbotId={chatbot.id}
                isPlanNotification={isPlanNotification}
                setIsPlanNotification={setIsPlanNotification}
              />
            </>
          )}

          {/*------------------------------------------history-component----------------------------------------------*/}
          {editChatbot == "history" && <History chatbotId={chatbot.id} />}

          {/*------------------------------------------leads-component----------------------------------------------*/}
          {editChatbot == "leads" && <Leads chatbotId={chatbot.id} />}
        </div>
      </div>

      //   <div className="dashboard-container">
      //     <center>
      //       <h1 className="title">{chatbot.name}</h1>
      //       <Radio.Group onChange={onChange} value={source} disabled={loading}>
      //         <Radio name="source" value={"chatbot"}>
      //           Chatbot
      //         </Radio>
      //         <Radio name="source" value={"settings"}>
      //           Settings
      //         </Radio>
      //         <Radio name="source" value={"sources"} onClick={fetchData}>
      //           Sources
      //         </Radio>
      //         <Radio name="source" value={"delete"} onClick={showModal}>
      //           Delete
      //         </Radio>
      //       </Radio.Group>

      //       {/* managing the component rendering */}
      //       {source == "chatbot" && (
      //         <>
      //           <Chat
      //             chatbot={chatbot}
      //             messages={messages}
      //             setMessages={setMessages}
      //             messagesTime={messagesTime}
      //             setMessagesTime={setMessagesTime}
      //             sessionID={sessionID}
      //             sessionStartDate={sessionStartDate}
      //           />{" "}
      //           <DeleteModal
      //             open={open}
      //             setOpen={setOpen}
      //             chatbotId={chatbot.id}
      //           />
      //         </>
      //       )}
      //       {source == "settings" && (
      //         <>
      //           <Settings chatbotId={chatbot.id} />
      //           <DeleteModal
      //             open={open}
      //             setOpen={setOpen}
      //             chatbotId={chatbot.id}
      //           />
      //         </>
      //       )}
      //       {source == "sources" && !loading && (
      //         <>
      //           <Home
      //             updateChatbot="true"
      //             qaData={qaData}
      //             textData={textData}
      //             fileData={fileData}
      //             crawlingData={crawlData}
      //             chatbotId={chatbot.id}
      //             chatbotName={chatbot.name}
      //           />
      //           <DeleteModal
      //             open={open}
      //             setOpen={setOpen}
      //             chatbotId={chatbot.id}
      //           />
      //         </>
      //       )}
      //     </center>
      //   </div>
    );
  } else if (status === "unauthenticated") {
    redirect("/account/login");
  }
}

export default dynamic((): any => Promise.resolve(Dashboard), { ssr: false });
