"use client";
import React, { useState, useEffect } from "react";
import "./chatbot.css"; // You can style it with CSS
import { MessageOutlined, CloseOutlined } from "@ant-design/icons";
import Chat from "@/app/(secure)/chatbot/dashboard/_components/Chat/Chat";
import ChatV2 from "../../(secure)/chatbot/dashboard/_components/Chat-v2/ChatV2";
import { functionCallHandler } from "@/app/_helpers/client/functionCallHandler";
import { useSearchParams } from "next/navigation";
import { getDate, getTime } from "../../_helpers/client/getTime";
import { v4 as uuid } from "uuid";
import { defaultChatBubbleIconColor } from "../../_helpers/constant";
import chatbubble from "../../../../public/create-chatbot-svgs/message-2.svg";
import Image from "next/image";
import axios from "axios";

function Chatbot() {
  const params = useSearchParams();
  const chatbot = { id: params.get("chatbotID") };

  const [messages, setMessages] = useState([]);

  const [messagesTime, setMessagesTime] = useState([]);

  const [sessionID, setSessionID] = useState();
  const [threadId, setThreadId] = useState("");
  const [sessionStartDate, setSessionStartDate] = useState();

  const [userId, setUserId] = useState();
  const [displayName, setDisplayName] = useState();
  const [chatbotName, setChatbotName] = useState();

  /// states to set chatbot setting
  const [chatbotIconColor, setChatbotIconColor] = useState(
    defaultChatBubbleIconColor
  );
  const [suggestedMessages, setSuggestedMessages] = useState([]);
  const [initialMessage, setInitialMessage] = useState([]);
  const [bubbleIconUrl, setBubbleIconUrl] = useState();
  const [profilePictureUrl, setProfilePictureUrl] = useState();

  /// lead details
  const [leadFields, setLeadFields] = useState({});
  const [leadTitle, setLeadTitle] = useState();
  const [userDetails, setUserDetails] = useState();

  /// chabot apperance
  const [userMessageColor, setUserMessageColor] = useState();
  const [messagePlaceholder, setMessagePlaceholder] = useState();

  /// state to keep the chatbot open or close
  const [state, setState] = useState(false);

  const [botType, setBotType] = useState("bot-v1");

  function toggleChatbot() {
    setState(!state);
  }

  /// set user location
  const [userLocation, setUserLocation] = useState("");

  /// used to fetch the bot details
  const [isBotDetailsFetched, setIsBotDetailsFetched] = useState(false);
  const [user, setUser] = useState(null);
  const [isPlanNotification, setIsPlanNotification] = useState(false);

  const getUser = async (userId) => {
    const response = await axios.get(
      `${process.env.NEXT_PUBLIC_WEBSITE_URL}api/user?userId=${userId}`
    );

    setUser(response.data.user);
  };

  const createThread = async () => {
    const res = await fetch(`/api/assistants/threads`, {
      method: "POST",
    });
    const data = await res.json();
    setThreadId(data.threadId);
  };

  useEffect(() => {
    const planEndTimer = setInterval(() => {
      if (user) {
        const planEndDate = new Date(user?.endDate);

        if (new Date() > planEndDate) {
          setIsPlanNotification(true);
        }
      }
    }, 1000);

    return () => clearInterval(planEndTimer);
  }, [user]);

  useEffect(() => {
    // create a new threadID when chat component created
    createThread();
  }, []);

  useEffect(() => {
    setSessionID(uuid());
    setSessionStartDate(getDate());
    const fetchBotDetails = async () => {
      setIsBotDetailsFetched(true);
      const response = await axios.get(
        // `${process.env.NEXT_PUBLIC_WEBSITE_URL}chatbot/details/api?chatbotId=${chatbot?.id}`
        `${process.env.NEXT_PUBLIC_WEBSITE_URL}chatbot/popup/details/api?chatbotId=${chatbot?.id}`
      );

      const botDetails = response.data;
      setChatbotName(botDetails?.chatbotName);
      setDisplayName(botDetails?.chatbotSettings[0]?.chatbotDisplayName);
      setChatbotIconColor(botDetails?.chatbotSettings[0]?.chatbotIconColor);
      setBubbleIconUrl(botDetails?.chatbotSettings[0]?.bubbleIconUrl);
      setProfilePictureUrl(botDetails?.chatbotSettings[0]?.profilePictureUrl);

      getUser(botDetails?.userId);

      setUserId(botDetails?.userId);
      setUserLocation(botDetails?.country);
      setSuggestedMessages(botDetails?.chatbotSettings[0]?.suggestedMessages);
      setInitialMessage(botDetails?.chatbotSettings[0]?.initialMessage);
      setLeadFields(botDetails?.chatbotSettings[0]?.leadFields);
      setLeadTitle(botDetails?.chatbotSettings[0]?.leadTitle);
      setUserDetails(botDetails?.chatbotSettings[0]?.userDetails);
      setUserMessageColor(botDetails?.chatbotSettings[0]?.userMessageColor);
      setMessagePlaceholder(botDetails?.chatbotSettings[0]?.messagePlaceholder);
      setBotType(botDetails?.botType);
      botDetails?.chatbotSettings[0]?.initialMessage?.map((message, index) => {
        // setMessages((prev): any => {
        //   [
        //     ...prev,
        //     {
        //       role: "assistant",
        //       content: message,
        //     },
        //   ];
        // });
        setMessages((prevMessages) => [
          ...prevMessages,
          {
            role: "assistant",
            content: message,
          },
        ]);

        setMessagesTime((prevMessages) => [
          ...prevMessages,
          {
            role: "assistant",
            content: message,
            messageTime: getDate(),
            messageType: "initial",
          },
        ]);
      });
    };

    if (!isBotDetailsFetched && chatbot.id) fetchBotDetails();
  }, [chatbot.id]);

  return (
    <>
      {/* {state && ( */}
      <div className="embed-chatbot-container">
        {botType === "bot-v1" ? (
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
            isPopUp={true}
            userId={userId}
            chatbotName={chatbotName}
            chatbotDisplayName={displayName}
            suggestedMessages={suggestedMessages}
            initialMessage={initialMessage}
            profilePictureUrl={profilePictureUrl}
            leadFields={leadFields}
            leadTitle={leadTitle}
            userLeadDetails={userDetails}
            isPlanNotification={isPlanNotification}
            setIsPlanNotification={setIsPlanNotification}
            userMessageColor={userMessageColor}
            messagePlaceholder={messagePlaceholder}
            userLocation={userLocation}
          />
        ) : (
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
            isPopUp={true}
            userId={userId}
            chatbotName={chatbotName}
            chatbotDisplayName={displayName}
            suggestedMessages={suggestedMessages}
            initialMessage={initialMessage}
            profilePictureUrl={profilePictureUrl}
            leadFields={leadFields}
            leadTitle={leadTitle}
            userLeadDetails={userDetails}
            isPlanNotification={isPlanNotification}
            setIsPlanNotification={setIsPlanNotification}
            userMessageColor={userMessageColor}
            messagePlaceholder={messagePlaceholder}
            userLocation={userLocation}
            functionCallHandler={functionCallHandler}
          />
        )}
      </div>
      {/* )} */}

      {/* <div className="chatbot-icon" onClick={toggleChatbot}> */}
      {/* {state ? (
          <CloseOutlined className="chat-icon" />
        ) : (
          <MessageOutlined className="chat-icon" />
        )} */}
      {/* <div
        className="chatbot-icon"
        style={
          {
            // justifyContent:
            //   botSettings?.chatbotBubbleAlignment === "right" ? "flex-end" : "",
          }
        }
        onClick={toggleChatbot}
      >
        <div
          className="message-icon-child"
          style={{
            backgroundColor: bubbleIconUrl ? "" : chatbotIconColor,
          }}
        >
          <Image
            src={bubbleIconUrl ? bubbleIconUrl : chatbubble}
            alt="icon"
            height={bubbleIconUrl ? "64" : 32}
            width={bubbleIconUrl ? "64" : 32}
            style={{ borderRadius: "50%" }}
          />
        </div>
      </div> */}
      {/* </div> */}
    </>
  );
}

export default Chatbot;
