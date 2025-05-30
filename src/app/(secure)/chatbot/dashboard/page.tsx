"use client";
import {
  Button,
  Dropdown,
  MenuProps,
  Modal,
  Radio,
  RadioChangeEvent,
} from "antd";
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
import tick from "../../../../../public/svgs/tick-circle-fill.svg";
import arrowIcon from "../../../../../public/svgs/Feather Icon.svg";
import { CreateBotContext } from "../../../_helpers/client/Context/CreateBotContext";
import History from "./_components/History/History";
import EmbedSite from "./_components/EmbedSite/EmbedSite";
import Integration from "./_components/Integration/Integration";
import { ChatbotSettingContext } from "../../../_helpers/client/Context/ChatbotSettingContext";
import { JWT_EXPIRED } from "../../../_helpers/errorConstants";
import axios from "axios";
import Leads from "./_components/Leads/Leads";
import {
  CaretDownOutlined,
  CaretUpOutlined,
  DownOutlined,
} from "@ant-design/icons";
import ChatV2 from "./_components/Chat-v2/ChatV2";
import { functionCallHandler } from "@/app/_helpers/client/functionCallHandler";
import { useRouter } from "next/navigation";

function Dashboard() {
  const { status } = useSession();

  /// get the bot context
  const botContext: any = useContext(CreateBotContext);
  const botDetails = botContext?.createBotInfo;
  const router = useRouter();

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
  const [threadId, setThreadId] = useState("");
  const [sessionStartDate, setSessionStartDate]: any = useState();

  const [isPlanNotification, setIsPlanNotification] = useState(false);
  const [user, setUser] = useState<any>(null);

  // Dropdown item current value
  const [selectedValue, setSelectedValue] = useState("chatbot");
  // Dropdown open or not
  const [isOpen, setIsOpen] = useState(false);

  const onClick = (e: any) => {
    const selectedItem = dropdownMenuItems.find((item) => item.key === e.key);
    setIsOpen(false);
    if (selectedItem) {
      setSelectedValue(selectedItem.key);
    }
  };

  const dropdownMenuItems = [
    {
      key: "chatbot",
      label: (
        <div
          className="dropdown-item"
          style={{
            color: selectedValue === "chatbot" ? "#2e58ea" : undefined,
            alignItems: "center",
            justifyContent: "space-between",
            display: "flex",
            fontSize: "16px",
          }}
        >
          chatbot
          {selectedValue === "chatbot" ? (
            <Image src={tick} alt="tick-icon" />
          ) : null}
        </div>
      ),
      onClick: () => botContext?.handleChange("editChatbot")("chatbot"),
    },
    {
      key: "settings",
      label: (
        <div
          className="dropdown-item"
          style={{
            color: selectedValue === "settings" ? "#2e58ea" : undefined,
            alignItems: "center",
            justifyContent: "space-between",
            display: "flex",
            fontSize: "16px",
          }}
        >
          settings
          {selectedValue === "settings" ? (
            <Image src={tick} alt="tick-icon" />
          ) : null}
        </div>
      ),
      onClick: () => botContext?.handleChange("editChatbot")("settings"),
    },
    {
      key: "data sources",
      label: (
        <div
          className="dropdown-item"
          style={{
            color: selectedValue === "data sources" ? "#2e58ea" : undefined,
            alignItems: "center",
            justifyContent: "space-between",
            display: "flex",
            fontSize: "16px",
          }}
        >
          data sources
          {selectedValue === "data sources" ? (
            <Image src={tick} alt="tick-icon" />
          ) : null}
        </div>
      ),
      onClick: () => botContext?.handleChange("editChatbot")("sources"),
    },
    {
      key: "Integrations",
      label: (
        <div
          className="dropdown-item"
          style={{
            color: selectedValue === "Integrations" ? "#2e58ea" : undefined,
            alignItems: "center",
            justifyContent: "space-between",
            display: "flex",
            fontSize: "16px",
          }}
        >
          Integrations
          {selectedValue === "Integrations" ? (
            <Image src={tick} alt="tick-icon" />
          ) : null}
        </div>
      ),
      onClick: () => botContext?.handleChange("editChatbot")("integrations"),
    },
    {
      key: "Embed on site",
      label: (
        <div
          className="dropdown-item"
          style={{
            color: selectedValue === "Embed on site" ? "#2e58ea" : undefined,
            alignItems: "center",
            justifyContent: "space-between",
            display: "flex",
            fontSize: "16px",
          }}
        >
          Embed on site
          {selectedValue === "Embed on site" ? (
            <Image src={tick} alt="tick-icon" />
          ) : null}
        </div>
      ),
      onClick: () => botContext?.handleChange("editChatbot")("embedSite"),
    },
    {
      key: "Conversation History",
      label: (
        <div
          className="dropdown-item"
          style={{
            color:
              selectedValue === "Conversation History" ? "#2e58ea" : undefined,
            alignItems: "center",
            justifyContent: "space-between",
            display: "flex",
            fontSize: "16px",
          }}
        >
          Conversation History
          {selectedValue === "Conversation History" ? (
            <Image src={tick} alt="tick-icon" />
          ) : null}
        </div>
      ),
      onClick: () => botContext?.handleChange("editChatbot")("history"),
    },
    {
      key: "Leads",
      label: (
        <div
          className="dropdown-item"
          style={{
            color: selectedValue === "Leads" ? "#2e58ea" : undefined,
            alignItems: "center",
            justifyContent: "space-between",
            display: "flex",
            fontSize: "16px",
          }}
        >
          Leads
          {selectedValue === "Leads" ? (
            <Image src={tick} alt="tick-icon" />
          ) : null}
        </div>
      ),
      onClick: () => botContext?.handleChange("editChatbot")("leads"),
    },
  ];

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

        // Get the current time in UTC
        const nowUtc = new Date().toISOString();

        // Compare the current time in UTC with the plan end date
        if (new Date(nowUtc) > planEndDate) {
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

  const createThread = async () => {
    const res = await fetch(`/api/assistants/threads`, {
      method: "POST",
    });
    const data = await res.json();
    setThreadId(data.threadId);
  };

  useEffect(() => {
    setSessionID(uuid());
    setSessionStartDate(getDate());
    // create a new threadID when chat component created
    createThread();
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

        /// set user country
        botContext.handleChange("userCountry")(
          content?.country ? content?.country : "us"
        );

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
                  // window.history.back();
                  router.push(`/chatbot`);
                }}
              />
              {/* <h1>{chatbot?.name}</h1> */}
              <h1>{botDetails?.chatbotName}</h1>
            </div>

            {/*------------------------------------------options-container----------------------------------------------*/}
            {window.innerWidth < 767 ? (
              <Dropdown
                menu={{ items: dropdownMenuItems, onClick }}
                placement="bottom"
                trigger={["click"]}
                onVisibleChange={(visible) => setIsOpen(visible)}
              >
                <button className="options-container-dropdwon">
                  {selectedValue}
                  {isOpen ? <CaretUpOutlined /> : <CaretDownOutlined />}
                </button>
              </Dropdown>
            ) : (
              <>
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
                    className={`${
                      editChatbot === "integrations" ? "active" : ""
                    }`}
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
                    onClick={() =>
                      botContext?.handleChange("editChatbot")("leads")
                    }
                  >
                    <h3 className="option">Leads</h3>
                  </li>
                </ul>
                <hr />
              </>
            )}
          </div>
        </div>

        <div className="bottom">
          {/*------------------------------------------chatbot-component----------------------------------------------*/}
          {editChatbot == "chatbot" && (
            <>
              {chatbot?.botType == "bot-v2" ? (
                <ChatV2
                  chatbot={chatbot}
                  messages={messages}
                  setMessages={setMessages}
                  messagesTime={messagesTime}
                  setMessagesTime={setMessagesTime}
                  threadID={threadId}
                  sessionStartDate={sessionStartDate}
                  setThreadId={createThread}
                  setSessionStartDate={setSessionStartDate}
                  isPlanNotification={isPlanNotification}
                  setIsPlanNotification={setIsPlanNotification}
                  functionCallHandler={functionCallHandler}
                />
              ) : (
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
              )}
            </>
          )}
          {/*------------------------------------------settings-component----------------------------------------------*/}
          {editChatbot == "settings" && (
            <Settings
              chatbotId={chatbot.id}
              chatbotName={botDetails?.chatbotName}
              isPlanNotification={isPlanNotification}
              setIsPlanNotification={setIsPlanNotification}
            />
          )}

          {/*------------------------------------------sources-component----------------------------------------------*/}
          {editChatbot == "sources" && !loading && (
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
              botType={chatbot.botType}
              assistantType={chatbot.assistantType}
            />
          )}

          {/*------------------------------------------integrations-component----------------------------------------------*/}
          {editChatbot == "integrations" && !loading && (
            <Integration
              isPlanNotification={isPlanNotification}
              setIsPlanNotification={setIsPlanNotification}
            />
          )}

          {/*------------------------------------------embed-on-site-component----------------------------------------------*/}
          {editChatbot == "embedSite" && !loading && (
            <EmbedSite
              chatbotId={chatbot.id}
              isPlanNotification={isPlanNotification}
              setIsPlanNotification={setIsPlanNotification}
            />
          )}

          {/*------------------------------------------history-component----------------------------------------------*/}
          {editChatbot == "history" && <History chatbotId={chatbot.id} />}

          {/*------------------------------------------leads-component----------------------------------------------*/}
          {editChatbot == "leads" && <Leads chatbotId={chatbot.id} />}
        </div>
      </div>
    );
  } else if (status === "unauthenticated") {
    redirect("/account/login");
  }
}

export default dynamic((): any => Promise.resolve(Dashboard), { ssr: false });
