import React, { useContext, useEffect, useState, useRef } from "react";
import Image from "next/image";
import exportBtn from "../../../../../../../public/svgs/export-btn.svg";
import { useCookies } from "react-cookie";
import likeIcon from "../../../../../../../public/svgs/like.svg";
import dislikeIcon from "../../../../../../../public/svgs/dislike.svg";
import "./history.scss";
import ChatbotNameModal from "../../../../../_components/Modal/ChatbotNameModal";
import { message } from "antd";
import { ChatbotSettingContext } from "../../../../../_helpers/client/Context/ChatbotSettingContext";
import { PrintingChats } from "../Printing-Chats/Printing";
import ReactToPrint from "react-to-print";
import {
  AUTHORIZATION_FAILED,
  JWT_EXPIRED,
} from "../../../../../_helpers/errorConstants";
import { getTimeAgo } from "@/app/_helpers/client/getTime";
import { CreateBotContext } from "@/app/_helpers/client/Context/CreateBotContext";

function History({ chatbotId }: any) {
  let tempRef: any = useRef<HTMLDivElement>();

  const [chatHistoryList, setChatHistoryList]: any = useState([]);
  const [currentChatHistory, setCurrentChatHistory]: any = useState([]);
  const [activeCurrentChatHistory, setActiveCurrentChatHistory]: any =
    useState();

  const [cookies, setCookies] = useCookies(["userId"]);

  /// get the bot context
  const botContext: any = useContext(CreateBotContext);
  const botDetails = botContext?.createBotInfo;

  /// get the bot settings context
  const botSettingContext: any = useContext(ChatbotSettingContext);
  const botSettings = botSettingContext?.chatbotSettings;

  useEffect(() => {
    /// retrive the chatbot data
    const retriveData = async () => {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_WEBSITE_URL}chatbot/api/history?chatbotId=${chatbotId}&userId=${cookies.userId}&startDate=null&endDate=null&page=1&pageSize=10`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          // body: JSON.stringify({

          // }),
          // next: { revalidate: 0 },
        }
      );
      const content = await response.json();

      if (content?.message === JWT_EXPIRED) {
        message.error(AUTHORIZATION_FAILED).then(() => {
          window.location.href = "/account/login";
        });
        return;
      }
      setChatHistoryList(content?.chatHistory);
    };

    retriveData();
  }, []);

  /// chatbot messages feedback pop up state
  const [open, setOpen] = useState(false);
  const [feedbackText, setfeedbackText] = useState("");
  const [feedbackIndex, setFeedbackIndex] = useState(0);
  const [feedbackStatus, setfeedbackStatus] = useState("");

  /// Messages feedback opener
  async function openChatbotModal(index: number, status: string) {
    /// set the like/dislike btn check and the index to store the message history
    setFeedbackIndex(index);
    setfeedbackStatus(status);
    /// open the chatbot naming dialog box when creating bot
    setOpen(true);
  }

  /// handling the chatbot ok action
  const handleOk = async () => {
    if (feedbackText.length < 10) {
      message.error("Please provide add more feeback");
      return;
    }
    setOpen(false);

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_WEBSITE_URL}chatbot/dashboard/feedback/api`,
      {
        headers: {
          cache: "no-store",
        },
        method: "POST",
        body: JSON.stringify({
          chatbotId: chatbotId,
          messages: [...currentChatHistory.slice(0, feedbackIndex + 1)],
          feedback: { text: feedbackText, status: feedbackStatus },
        }),
        next: { revalidate: 0 },
      }
    );

    /// if response is ok then clear the feeback text
    if (!response.ok) throw new Error(await response.json());
    else {
      setfeedbackText("");
    }

    const body = await response.json();
    message.info(body?.message);
  };

  return (
    <div className="history-chat-container">
      {/*------------------------------------------left-section----------------------------------------------*/}
      <div className="chatbot-history-details">
        {/*------------------------------------------chat-list-section----------------------------------------------*/}
        <div className="detail">
          {botDetails?.referedFrom == "leads"}
          {chatHistoryList?.chats && (
            <>
              {Object.entries(chatHistoryList?.chats)
                ?.reverse()
                ?.map((data: any, index: any) => {
                  return (
                    <div
                      className={`first-message ${
                        activeCurrentChatHistory === `today${index}`
                          ? "active"
                          : ""
                      }`}
                      key={index}
                      onClick={() => {
                        setCurrentChatHistory(data[1]?.messages);
                        setActiveCurrentChatHistory("today" + index);
                      }}
                    >
                      <div
                        className="time"
                        style={{
                          padding: 0,
                          fontSize: "14px",
                          display: "flex",
                          flexDirection: "row",
                          justifyContent: "space-between",
                        }}
                      >
                        <div>
                          {data[1]?.email ? data[1]?.email : "Anonymous"}
                        </div>
                        <div>{getTimeAgo(data[1].sessionStartDate)}</div>
                      </div>

                      <div>
                        {
                          data[1]?.messages[
                            data[1]?.initialMessageLength
                              ? data[1]?.initialMessageLength
                              : 1
                          ]?.content
                        }
                      </div>
                    </div>
                  );
                })}
            </>
          )}
        </div>

        {/*------------------------------------------yesterday's-chat----------------------------------------------*/}
        {/* <div className="detail">
          {chatHistoryList?.yesterday?.chats && (
            <>
              <div className="time">Yesterday</div>
              {Object.entries(chatHistoryList?.yesterday?.chats)
                ?.reverse()
                ?.map((data: any, index: any) => {
                  return (
                    <div
                      className={`first-message ${
                        activeCurrentChatHistory === `yesterday${index}`
                          ? "active"
                          : ""
                      }`}
                      key={index}
                      onClick={() => {
                        setCurrentChatHistory(data[1]?.messages);
                        setActiveCurrentChatHistory("yesterday" + index);
                      }}
                    >
                      <div
                        className="time"
                        style={{ padding: 0, fontSize: "14px" }}
                      >
                        <div>
                          {data[1]?.email ? data[1]?.email : "Anonymous"}
                        </div>
                        <div>{getTimeAgo(data[1].sessionStartDate)}</div>
                      </div>

                      <div>
                        {
                          data[1]?.messages[
                            data[1]?.initialMessageLength
                              ? data[1]?.initialMessageLength
                              : 1
                          ]?.content
                        }
                      </div>
                    </div>
                  );
                })}
            </>
          )}
        </div> */}
        {/*------------------------------------------last-7-days-chat----------------------------------------------*/}
        {/* <div className="detail">
          {chatHistoryList?.lastSevenDay?.chats && (
            <>
              <div className="time">Last 7 days</div>
              {Object.entries(chatHistoryList?.lastSevenDay?.chats)
                ?.reverse()
                ?.map((data: any, index: any) => {
                  return (
                    <div
                      className={`first-message ${
                        activeCurrentChatHistory === `lastSevenDay${index}`
                          ? "active"
                          : ""
                      }`}
                      key={index}
                      onClick={() => {
                        setCurrentChatHistory(data[1]?.messages);
                        setActiveCurrentChatHistory("lastSevenDay" + index);
                      }}
                    >
                      {
                        data[1]?.messages[
                          data[1]?.initialMessageLength
                            ? data[1]?.initialMessageLength
                            : 1
                        ]?.content
                      }
                    </div>
                  );
                })}
            </>
          )}
        </div> */}
      </div>

      {/* this is used for printing the chats initially it will be hidden but on print it will be visible*/}
      <PrintingChats
        ref={tempRef}
        messages={currentChatHistory}
        // messagesTime={messagesTime}
      />

      {/*------------------------------------------right-section----------------------------------------------*/}
      <div className="messages-section">
        {currentChatHistory.length != 0 && (
          <>
            <div className="header">
              <span>Powered by Torri.AI</span>
              <div className="action-btns">
                <ReactToPrint
                  trigger={() => {
                    return (
                      <button style={{ border: "none", background: "none" }}>
                        <Image src={exportBtn} alt="export-btn" />
                      </button>
                    );
                  }}
                  content={() => tempRef.current}
                />
              </div>
            </div>

            <hr />
          </>
        )}

        <div className="history-conversation-container">
          {currentChatHistory.map((message: any, index: any) => {
            if (message.role == "assistant")
              return (
                <React.Fragment key={index}>
                  <div
                    className="assistant-message-container"
                    style={{
                      marginTop:
                        `${message.messageType}` === "initial" ? "10px" : "0",
                    }}
                  >
                    <div
                      className="assistant-message"
                      style={{
                        display: "flex",
                        flexDirection: "column",
                      }}
                      dangerouslySetInnerHTML={{
                        __html: message.content,
                      }}
                    ></div>
                    {/* <div className="time">{message?.messageTime}</div> */}
                    {message.messageType !== "initial" && (
                      <div className="time">{message?.messageTime}</div>
                    )}

                    {(currentChatHistory[index + 1] === undefined ||
                      currentChatHistory[index + 1].role == "user") && (
                      <div className="like-dislike-container">
                        <Image
                          src={likeIcon}
                          alt="like-icon"
                          onClick={() => openChatbotModal(index, "like")}
                        />
                        <Image
                          src={dislikeIcon}
                          alt="dislike-icon"
                          onClick={() => openChatbotModal(index, "dislike")}
                        />
                      </div>
                    )}
                    {/* <div className="like-dislike-container">
                      <Image
                        src={likeIcon}
                        alt="like-icon"
                        onClick={() => openChatbotModal(index, "like")}
                      />
                      <Image
                        src={dislikeIcon}
                        alt="dislike-icon"
                        onClick={() => openChatbotModal(index, "dislike")}
                      />
                    </div> */}
                  </div>
                  <ChatbotNameModal
                    open={open}
                    setOpen={setOpen}
                    chatbotText={feedbackText}
                    setChatbotText={setfeedbackText}
                    handleOk={handleOk}
                    forWhat="feedback"
                  />
                </React.Fragment>
              );
            else
              return (
                <div className="user-message-container">
                  <div
                    className="user-message"
                    key={index}
                    style={{ backgroundColor: botSettings?.userMessageColor }}
                  >
                    {message.content}
                  </div>
                  <div className="time">{message?.messageTime}</div>
                </div>
              );
          })}
        </div>
      </div>
    </div>
  );
}

export default History;
