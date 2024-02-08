import React, {
  Suspense,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useCookies } from "react-cookie";
import "./chat.scss";
import { DislikeOutlined, SendOutlined, LikeOutlined } from "@ant-design/icons";
import Image from "next/image";
import { Slider, message } from "antd";
import ChatbotNameModal from "../../../../../_components/Modal/ChatbotNameModal";
import { getDate, getTime } from "../../../../../_helpers/client/getTime";
import copyIcon from "../../../../../../../public/svgs/copy-icon.svg";
import exportBtn from "../../../../../../../public/svgs/export-btn.svg";
import refreshBtn from "../../../../../../../public/svgs/refreshbtn.svg";
import likeIcon from "../../../../../../../public/svgs/like.svg";
import dislikeIcon from "../../../../../../../public/svgs/dislike.svg";
import sendChatIcon from "../../../../../../../public/svgs/send.svg";
import { v4 as uuid } from "uuid";
import { CreateBotContext } from "../../../../../_helpers/client/Context/CreateBotContext";
import { ChatbotSettingContext } from "../../../../../_helpers/client/Context/ChatbotSettingContext";
import { formatTimestamp } from "../../../../../_helpers/client/formatTimestamp";
import Icon from "../../../../../_components/Icon/Icon";
import RefreshBtn from "../../../../../../assets/svg/RefreshBtn";
import ExportBtn from "../../../../../../assets/svg/ExportBtn";
import { UserDetailsContext } from "../../../../../_helpers/client/Context/UserDetailsContext";

function Chat({
  chatbot,
  messages,
  setMessages,
  messagesTime,
  setMessagesTime,
  sessionID,
  sessionStartDate,
  setSessionID,
  setSessionStartDate,
  isPopUp = false,
  userId,
  chatbotName,
}: any) {
  /// get the bot context
  const botContext: any = useContext(CreateBotContext);
  const botDetails = botContext?.createBotInfo;

  /// get userDetails context
  const userDetailContext: any = useContext(UserDetailsContext);
  const userDetails = userDetailContext?.userDetails;

  /// get the bot settings context
  const botSettingContext: any = useContext(ChatbotSettingContext);
  const botSettings = botSettingContext?.chatbotSettings;

  const [cookies, setCookies] = useCookies(["userId"]);

  /// storing the input value
  const [userQuery, setUserQuery] = useState("");

  /// chat base response
  const [response, setResponse] = useState("");

  /// loading state
  const [loading, setLoading] = useState(false);

  const chatWindowRef: any = useRef(null);

  /// chatbot messages feedback pop up state
  const [open, setOpen] = useState(false);
  const [feedbackText, setfeedbackText] = useState("");
  const [feedbackIndex, setFeedbackIndex] = useState(0);
  const [feedbackStatus, setfeedbackStatus] = useState("");

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
          chatbotId: chatbot.id,
          messages: [...messages.slice(0, feedbackIndex + 1)],
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
    message.success(body?.message);
  };

  /// Messages feedback opener
  async function openChatbotModal(index: number, status: string) {
    /// set the like/dislike btn check and the index to store the message history
    setFeedbackIndex(index);
    setfeedbackStatus(status);
    /// open the chatbot naming dialog box when creating bot
    setOpen(true);
  }

  useEffect(() => {
    if (chatWindowRef.current) {
      // Scroll to the bottom of the chat window
      setTimeout(() => {
        chatWindowRef.current?.scrollTo(0, chatWindowRef.current.scrollHeight);
      }, 50);
    }
  }, [response]);

  async function storeHistory(userLatestQuery: any, gptLatestResponse: any) {
    /// update the message count
    userDetailContext?.handleChange("totalMessageCount")(
      userDetails?.totalMessageCount + 1
    );
    const percent =
      ((userDetails?.totalMessageCount + 1) / userDetails?.plan?.messageLimit) *
      100;

    /// store the percentage of message sent by user
    userDetailContext?.handleChange("percent")(percent);
    /// store/update the chathistory
    const store = await fetch(
      `${process.env.NEXT_PUBLIC_WEBSITE_URL}api/chathistory`,
      {
        method: "POST",
        body: JSON.stringify({
          chatbotId: chatbot.id,
          messages: [...messagesTime, userLatestQuery, gptLatestResponse],
          userId: cookies.userId ? cookies.userId : userId,
          sessionID,
          sessionStartDate,
          sessionEndDate: getDate(),
        }),
      }
    );
  }

  const onChange = (newValue: number) => {
    botSettingContext?.handleChange("temperature")(newValue);
  };

  /// get the chatbase response
  async function getReply(event: any) {
    if (event.key === "Enter" || event === "click") {
      /// clear the response
      setUserQuery("");
      /// set the user query
      setMessages((prev: any) => [
        ...prev,
        { role: "user", content: userQuery },
      ]);
      setMessagesTime((prev: any) => [
        ...prev,
        { role: "user", content: userQuery, messageTime: getDate() },
      ]);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_WEBSITE_URL}api/account/user/details?userId=${cookies?.userId}`,
        {
          method: "GET",
          next: { revalidate: 0 },
        }
      );

      const userDetails = await response.json();

      /// check if user can chat or not
      const userChatCountTillNow = userDetails?.userDetails?.totalMessageCount;
      const userPlanMessageLimit = userDetails?.plan?.messageLimit;
      if (userChatCountTillNow + 1 > userPlanMessageLimit) {
        message.error(
          "Sorry you have exceeded the chat limit. PLease upgrade your plan"
        );
        return;
      } else {
        if (userQuery.trim() == "") {
          alert("Please enter the message");
        } else {
          try {
            setLoading(true);
            /// get similarity search
            const response: any = await fetch(
              `${process.env.NEXT_PUBLIC_WEBSITE_URL}api/pinecone`,
              {
                method: "POST",
                body: JSON.stringify({
                  userQuery,
                  chatbotId: chatbot?.id,
                  // userId: cookies.userId,
                  //// default chatbot set
                  userId:
                    chatbot?.id === "123d148a-be02-4749-a612-65be9d96266c"
                      ? "651d111b8158397ebd0e65fb"
                      : chatbot?.id === "34cceb84-07b9-4b3e-ad6f-567a1c8f3557"
                      ? "65795294269d08529b8cd743"
                      : chatbot?.id === "f0893732-3302-46b2-922a-95e79ef3524c"
                      ? "651d111b8158397ebd0e65fb"
                      : chatbot?.id === "f8095ef4-6cd0-4373-a45e-8fe15cb6dd0f"
                      ? "6523fee523c290d75609a1fa"
                      : cookies.userId,
                }),
              }
            );

            /// parse the response and extract the similarity results
            const respText = await response.text();

            const similaritySearchResults = JSON.parse(respText).join("\n");
            console.log(similaritySearchResults);

            /// get response from backend in streaming
            const responseFromBackend: any = await fetch(
              `${process.env.NEXT_PUBLIC_WEBSITE_URL}api/chat`,
              {
                method: "POST",
                body: JSON.stringify({
                  similaritySearchResults,
                  messages,
                  userQuery,
                  chatbotId: chatbot?.id,
                  //// default chatbot set
                  userId:
                    chatbot?.id === "123d148a-be02-4749-a612-65be9d96266c"
                      ? "651d111b8158397ebd0e65fb"
                      : chatbot?.id === "34cceb84-07b9-4b3e-ad6f-567a1c8f3557"
                      ? "65795294269d08529b8cd743"
                      : chatbot?.id === "f0893732-3302-46b2-922a-95e79ef3524c"
                      ? "651d111b8158397ebd0e65fb"
                      : chatbot?.id === "f8095ef4-6cd0-4373-a45e-8fe15cb6dd0f"
                      ? "6523fee523c290d75609a1fa"
                      : cookies.userId
                      ? cookies.userId
                      : userId,
                }),
                next: { revalidate: 0 },
              }
            );
            let resptext = "";
            const reader = responseFromBackend.body
              .pipeThrough(new TextDecoderStream())
              .getReader();
            while (true) {
              const { value, done } = await reader.read();
              if (done) {
                /// setting the response when completed
                setMessages((prev: any) => [
                  ...prev,
                  { role: "assistant", content: resptext },
                ]);
                /// setting the response time when completed
                setMessagesTime((prev: any) => [
                  ...prev,
                  {
                    role: "assistant",
                    content: resptext,
                    messageTime: getDate(),
                  },
                ]);
                /// store history
                const userLatestQuery = { role: "user", content: userQuery };
                const gptLatestResponse = {
                  role: "assistant",
                  content: resptext,
                  messageTime: getDate(),
                };

                storeHistory(userLatestQuery, gptLatestResponse);
                setResponse("");
                setLoading(false);
                break;
              }

              resptext += value;
              setResponse(resptext);
            }
          } catch (e: any) {
            console.log(
              "Error while getting completion from custom chatbot",
              e,
              e.message
            );
          } finally {
            setLoading(false);
          }
        }
      }
    }
    // }
  }

  /// refresh the chat window
  const refreshChat = () => {
    setMessages(
      chatbot.initial_message == null
        ? [{ role: "assistant", content: `Hi! What can I help you with?` }]
        : [{ role: "assistant", content: chatbot.initial_message }]
    );
    setMessagesTime(
      chatbot.initial_message == null
        ? [
            {
              role: "assistant",
              content: `Hi! What can I help you with?`,
              messageTime: getTime(),
            },
          ]
        : [{ role: "assistant" }]
    );

    setSessionID(uuid());
    setSessionStartDate(getDate());
  };

  // console.log(messageImages);

  /// to copy chatbot Id
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(chatbot?.id);
      message.success("ID copied to clipboard");
    } catch (err: any) {
      message.error("Failed to copy ", err.message);
    }
  };

  return (
    <div className="chat-container">
      {/*------------------------------------------left-section----------------------------------------------*/}
      {!isPopUp && (
        <div className="chatbot-details">
          <div className="detail">
            <span>ID</span>
            <div className="chatbot-id">
              <span>{chatbot?.id}</span>{" "}
              <Image
                src={copyIcon}
                alt="copy-icon"
                style={{ cursor: "pointer" }}
                onClick={handleCopy}
              />
            </div>
          </div>

          <div className="detail">
            <span>Status</span>
            <div className="status">
              <div className="dot"></div> <span>Trained</span>
            </div>
          </div>

          <div className="detail">
            <span>Model</span>
            <div className="model">
              <span>{botSettings?.model}</span>
            </div>
          </div>

          <div className="detail">
            <span>Number of characters</span>
            <div className="characters">
              <span>{botSettings?.numberOfCharacterTrained}</span>
            </div>
          </div>

          <div className="detail">
            <span>Visibility</span>
            <div className="visibility">
              <span>{botSettings?.visibility}</span>
            </div>
          </div>

          <div className="detail">
            <div className="temperature">
              <span>Temperature</span>
              <span>{botSettings?.temperature}</span>
            </div>

            <Slider
              min={0}
              max={1}
              onChange={onChange}
              value={
                typeof botSettings?.temperature === "number"
                  ? botSettings?.temperature
                  : 0
              }
              disabled={true}
              step={0.1}
            />
            <div className="slider-bottom">
              <div>Reserved</div>
              <div>Creative</div>
            </div>
          </div>

          <div className="detail">
            <span>Last trained at</span>
            <div className="trained">
              <span>{formatTimestamp(botSettings?.lastTrained)}</span>
            </div>
          </div>
        </div>
      )}

      {/*------------------------------------------right-section----------------------------------------------*/}
      <div
        className="messages-section"
        style={{
          backgroundColor: botSettings?.theme === "dark" ? "black" : "",
        }}
      >
        <div className="header">
          <span>Powered by Lucifer.AI</span>
          <div className="action-btns">
            {/* <Image src={refreshBtn} alt="refresh-btn" onClick={refreshChat} /> */}
            {/* <Image src={exportBtn} alt="export-btn" /> */}
            <Icon
              Icon={RefreshBtn}
              onClick={refreshChat}
              className={botSettings?.theme === "dark" ? "color-white" : ""}
            />
            <Icon
              Icon={ExportBtn}
              className={botSettings?.theme === "dark" ? "color-white" : ""}
            />
          </div>
        </div>

        <hr />

        <div className="conversation-container" ref={chatWindowRef}>
          {messages.map((message: any, index: any) => {
            if (message.role == "assistant")
              return (
                <React.Fragment key={index}>
                  <div
                    className="assistant-message-container"
                    style={{
                      marginTop:
                        `${messagesTime[index].messageType}` === "initial"
                          ? "10px"
                          : "0",
                    }}
                  >
                    <div
                      className="assistant-message"
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        backgroundColor:
                          botSettings?.theme === "dark" ? "#353945" : "",
                        color: botSettings?.theme === "dark" ? "#FCFCFD" : "",
                      }}
                      dangerouslySetInnerHTML={{
                        __html: message.content,
                      }}
                    ></div>
                    {messagesTime[index].messageType !== "initial" && (
                      <div className="time">
                        {messagesTime[index]?.messageTime}
                      </div>
                    )}
                    {(messages[index + 1] === undefined ||
                      messages[index + 1].role == "user") && (
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
                  <div className="time">{messagesTime[index]?.messageTime}</div>
                </div>
              );
          })}
          {loading && response.length == 0 && (
            <div className="assistant-message-container">
              <div
                className="assistant-message"
                style={{
                  backgroundColor:
                    botSettings?.theme === "dark" ? "#353945" : "",
                  color: botSettings?.theme === "dark" ? "#FCFCFD" : "",
                }}
              >
                <div className="typing-indicator">
                  <div className="dot"></div>
                  <div className="dot"></div>
                  <div className="dot"></div>
                </div>
              </div>
            </div>
          )}
          {response && (
            <div className="assistant-message-container">
              <div
                className="assistant-message"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  backgroundColor:
                    botSettings?.theme === "dark" ? "#353945" : "",
                  color: botSettings?.theme === "dark" ? "#FCFCFD" : "",
                }}
                dangerouslySetInnerHTML={{ __html: response }}
              />
            </div>
          )}
        </div>
        <div
          className="chat-question"
          style={{
            backgroundColor: botSettings?.theme === "dark" ? "#353945" : "",
          }}
        >
          <input
            style={{
              backgroundColor: botSettings?.theme === "dark" ? "#353945" : "",
              color: botSettings?.theme === "dark" ? "#FCFCFD" : "",
            }}
            type="text"
            onKeyDown={getReply}
            onChange={(event) => {
              setUserQuery(event.target.value);
            }}
            placeholder={`Message ${
              isPopUp ? chatbotName : botDetails?.chatbotName
            }`}
            value={userQuery}
          />
          <button
            className="icon"
            onClick={() => getReply("click")}
            style={{ backgroundColor: botSettings?.userMessageColor }}
          >
            <Image src={sendChatIcon} alt="send-chat-icon" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default Chat;
