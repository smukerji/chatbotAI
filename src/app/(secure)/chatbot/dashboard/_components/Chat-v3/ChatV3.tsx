import React, { useContext, useEffect, useRef, useState } from "react";
import "../Chat/chat.scss";
import { ChatbotSettingContext } from "@/app/_helpers/client/Context/ChatbotSettingContext";
import Image from "next/image";
import Icon from "@/app/_components/Icon/Icon";
import ChatBotIcon from "../../../../../../../public/create-chatbot-svgs/ChatBotIcon.svg";
import RefreshBtn from "@/assets/svg/RefreshBtn";
import { PrintingChats } from "../Printing-Chats/Printing";
import { getDate } from "@/app/_helpers/client/getTime";
import { UserDetailsContext } from "@/app/_helpers/client/Context/UserDetailsContext";
import CloseEmbedBotIcon from "@/assets/svg/CloseEmbedBotIcon";
import ReactToPrint from "react-to-print";
import ExportBtn from "@/assets/svg/ExportBtn";
import likeIcon from "../../../../../../../public/svgs/like.svg";
import dislikeIcon from "../../../../../../../public/svgs/dislike.svg";
import sendChatIcon from "../../../../../../../public/svgs/send.svg";
import ChatbotNameModal from "@/app/_components/Modal/ChatbotNameModal";
import { Button, message } from "antd";
import PhoneInput from "react-phone-input-2";
import { parsePhoneNumber } from "awesome-phonenumber";
import { useRouter } from "next/navigation";
import {
  AUTHORIZATION_FAILED,
  JWT_EXPIRED,
} from "@/app/_helpers/errorConstants";
import { CreateBotContext } from "@/app/_helpers/client/Context/CreateBotContext";
import { useCookies } from "react-cookie";
import axios from "axios";
import MarkdownPreview from "@uiw/react-markdown-preview";
import { v4 as uuid } from "uuid";

function ChatV3({
  chatbot,
  messages,
  setMessages,
  messagesTime,
  setMessagesTime,
  threadID,
  sessionStartDate,
  setThreadId,
  setSessionStartDate,
  isPopUp = false,
  userId,
  chatbotName,
  chatbotDisplayName,
  suggestedMessages,
  initialMessage,
  profilePictureUrl,
  leadFields,
  leadTitle,
  userLeadDetails,
  isPlanNotification,
  setIsPlanNotification,
  userMessageColor,
  messagePlaceholder,
  userLocation,
  setSessionID,
  sessionID,
  functionCallHandler = () => Promise.resolve(""),
}: any) {
  let tempRef: any = useRef<HTMLDivElement>();
  const router = useRouter();

  /// get the bot context
  const botContext: any = useContext(CreateBotContext);
  const botDetails = botContext?.createBotInfo;

  /// get userDetails context
  const userDetailContext: any = useContext(UserDetailsContext);
  const userDetails = userDetailContext?.userDetails;

  /// get the bot settings context
  const botSettingContext: any = useContext(ChatbotSettingContext);
  const botSettings = botSettingContext?.chatbotSettings;

  leadFields = botSettingContext?.chatbotSettings?.leadFields
    ? botSettingContext?.chatbotSettings?.leadFields
    : leadFields;

  const [cookies, setCookies] = useCookies([
    "userId",
    `leadDetails-${chatbot.id}`,
  ]);

  /// storing the input value
  const [userQuery, setUserQuery] = useState("");

  /// chat base response
  const [response, setResponse] = useState("");

  /// state to store the chat history id
  const chatHistoryId = useRef("");

  /// loading state
  const [loading, setLoading] = useState(false);

  /// skip leading form
  const [skipLeadForm, setSkipLeadForm] = useState(false);

  /// isLeadform submitted
  const [isLeadFormSubmitted, setIsLeadFormSubmitted] = useState(false);
  const [leadError, setLeadError] = useState("");

  const chatWindowRef: any = useRef(null);

  /// for apply css for embed bot on mobile screens
  const [innerWidth, setInnerWidth] = useState(false);

  /// chatbot messages feedback pop up state
  const [open, setOpen] = useState(false);
  const [feedbackText, setfeedbackText] = useState("");
  const [feedbackIndex, setFeedbackIndex] = useState(0);
  const [feedbackStatus, setfeedbackStatus] = useState("");

  /// lead form errors
  const [emailError, setEmailError] = useState("");
  const [numberError, setNumberError] = useState("");
  const [nameError, setNameError] = useState("");
  const [validNumberError, setValidNumberError] = useState("");

  /// state to ensure if user has turned webSearch on or off
  const [webSearch, setWebSearch] = useState(false);

  /// chatbot lead section state
  const [leadDetails, setLeadDetails] = useState({
    name: "",
    email: "",
    number: "",
  });

  /// to check if iframe is loaded or not
  const [iframeLoaded, setiFrameLoaded] = useState(false);

  /// state for max phone number limit
  const [mobileNumber, setMobileNumber] = useState("");
  const [isNumberValid, setIsNumberValid] = useState(false);

  /// refresh the chat window
  const refreshChat = () => {
    setMessages([]);
    setMessagesTime([]);
    setLeadDetails({
      name: "",
      email: "",
      number: "",
    });

    setSessionID(uuid());

    /// check if chat window is opened from popup
    if (isPopUp) {
      initialMessage?.map((message: string, index: number) => {
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
      });
    } else {
      userDetailContext?.handleChange("isLeadFormSubmitted")(false);
      botSettings?.initialMessage?.map((message: string, index: number) => {
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
      });
    }
    // setThreadId();
    setSessionStartDate(getDate());
  };

  async function storeHistory(prevMessages: any) {
    /// update the message count
    if (!isPopUp) {
      userDetailContext?.handleChange("totalMessageCount")(
        userDetails?.totalMessageCount + 1
      );
      const percent =
        ((userDetails?.totalMessageCount + 1) /
          userDetails?.plan?.messageLimit) *
        100;

      /// store the percentage of message sent by user
      userDetailContext?.handleChange("percent")(percent);
    }
    /// store/update the chathistory
    const store = await fetch(
      `${process.env.NEXT_PUBLIC_WEBSITE_URL}api/chathistory`,
      {
        method: "POST",
        body: JSON.stringify({
          chatbotId: chatbot.id,
          messages: [...prevMessages],
          userId: !isPopUp ? cookies.userId : userId,
          sessionID: sessionID,
          sessionStartDate,
          sessionEndDate: getDate(),
          initialMessageLength: botSettings?.initialMessage?.length,
          email: cookies?.[`leadDetails-${chatbot.id}`]
            ? cookies?.[`leadDetails-${chatbot.id}`]
            : "Anonymous",
        }),
      }
    );

    const data = await store.json();
    chatHistoryId.current = data?.id;

    /// store the lead if new session
    if (cookies?.[`leadDetails-${chatbot.id}`]) {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_WEBSITE_URL}chatbot/api/lead`,
          {
            method: "POST",
            body: JSON.stringify({
              chatbotId: chatbot.id,
              userId: !isPopUp ? cookies.userId : userId,
              leadDetails: { email: cookies?.[`leadDetails-${chatbot.id}`] },
              sessionId: threadID,
              id: data?.id,
            }),
            next: { revalidate: 0 },
          }
        );
        if (res.ok) {
          const data = await res.json();
          console.log("Lead details stored", data);
        }
      } catch (error) {
        console.log("Error while storing lead details", error);
      }
    }
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
    message.info(body?.message);
  };

  /// Messages feedback opener
  async function openChatbotModal(index: number, status: string) {
    /// set the like/dislike btn check and the index to store the message history
    setFeedbackIndex(index);
    setfeedbackStatus(status);
    /// open the chatbot naming dialog box when creating bot
    setOpen(true);
  }

  // To check if phone number is valid or not
  function getPhoneNumberLength(value: any, country: any) {
    const pn = parsePhoneNumber(value, {
      regionCode: country.iso2,
    });

    // const numberInfo = pn.toJSON();
    setIsNumberValid(pn.valid);
    return pn.valid;
  }

  /// function for submitting lead
  const submitLeadDetail = async () => {
    setLeadError("");

    try {
      // if(emailError =)
      if (
        (leadFields?.name.isChecked && leadDetails.name === "") ||
        (leadFields?.email.isChecked && leadDetails.email === "") ||
        (leadFields?.number.isChecked && leadDetails.number === "")
      ) {
        setLeadError("Please, fill out all required  fields.");
        return;
      }

      if (
        nameError !== "" ||
        emailError !== "" ||
        numberError !== "" ||
        validNumberError !== ""
      )
        return;

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_WEBSITE_URL}chatbot/api/lead`,
        {
          method: "POST",
          body: JSON.stringify({
            chatbotId: chatbot.id,
            userId: !isPopUp ? cookies.userId : userId,
            leadDetails: leadDetails,
            sessionId: threadID,
            id: chatHistoryId.current,
          }),
          next: { revalidate: 0 },
        }
      );

      if (!res.ok) {
        throw await res.json();
      }
      /// Store the cookie

      setCookies(
        `leadDetails-${chatbot.id}`,
        leadDetails.email ? leadDetails.email : "N/A",
        {
          expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 60), // 60 days
          path: "/",
        }
      );

      // message.success(data?.message);
      if (isPopUp) {
        setIsLeadFormSubmitted(true);
      }

      userDetailContext?.handleChange("isLeadFormSubmitted")(true);
    } catch (error) {}
  };

  /// send the user message
  const sendMessage = async (text: string) => {
    /// call n8n API to get the reponse
    const response = await axios.post(
      `${process.env.NEXT_PUBLIC_WEBSITE_URL}api/n8n/assistant`,
      {
        chatbotId: chatbot?.id,
        chatInput: text,
        userId: !isPopUp ? cookies.userId : userId,
        sessionId: sessionID,
        assistantType: chatbot?.assistantType,
      }
    );
    /// check if response is not okay
    if (response.status != 200) {
      message.error(response.data?.message);
      return;
    }

    /// store the message
    setMessages((prev: any) => [
      ...prev,
      { role: "assistant", content: response.data?.message },
    ]);

    setMessagesTime((prev: any) => {
      const newMessage = {
        role: "assistant",
        content: response.data?.message,
        messageTime: getDate(),
      };
      storeHistory([...prev, { ...newMessage }]);
      return [...prev, { ...newMessage }];
    });

    setLoading(false);
  };

  async function getReply(event: any) {
    if (event.key === "Enter" || event === "click") {
      if (userQuery.trim() == "") {
        message.error("Please enter the message");
        return;
      } else if (isPlanNotification) {
        message.error("Please contact administrator to renew the plan");
        return;
      }
      setLoading(true);
      const tempUserMessageTime = getDate();
      /// clear the response
      setUserQuery("");
      /// set the user query
      setMessages((prev: any) => [
        ...prev,
        { role: "user", content: userQuery },
      ]);
      setMessagesTime((prev: any) => [
        ...prev,
        { role: "user", content: userQuery, messageTime: tempUserMessageTime },
      ]);

      const filterUserId = !isPopUp ? cookies?.userId : userId;
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_WEBSITE_URL}api/account/user/details?userId=${filterUserId}`,
        {
          method: "GET",
          next: { revalidate: 0 },
        }
      );

      const userDetails = await response.json();

      if (userDetails?.message === JWT_EXPIRED) {
        message.error(AUTHORIZATION_FAILED).then(() => {
          window.location.href = "/account/login";
        });
        return;
      }

      /// check if user can chat or not
      const userChatCountTillNow = userDetails?.userDetails?.totalMessageCount;
      const userPlanMessageLimit = userDetails?.plan?.messageLimit;
      if (userChatCountTillNow + 1 > userPlanMessageLimit) {
        message.error(
          "Sorry you have exceeded the chat limit. PLease upgrade your plan"
        );
        setLoading(false);

        return;
      } else {
        try {
          await sendMessage(userQuery);
        } catch (e: any) {
          console.log(
            "Error while getting completion from custom chatbot",
            e,
            e.message
          );
        }
      }
    }
    // }
  }

  /// function for skipping lead detail
  const skipLeadDetail = () => {
    setSkipLeadForm(true);
  };

  return (
    <div className={`chat-container ${innerWidth && "embed-chat-container"}`}>
      {/*------------------------------------------left-section----------------------------------------------*/}

      {/*------------------------------------------right-section----------------------------------------------*/}
      <div
        className={`messages-section ${iframeLoaded ? "iframe" : ""} ${
          innerWidth && "embed-messages-section"
        }`}
        style={{
          backgroundColor: botSettings?.theme === "dark" ? "black" : "",
        }}
      >
        <div className="header">
          <div className="chatbot-name-container">
            <Image
              src={
                isPopUp
                  ? profilePictureUrl
                    ? profilePictureUrl
                    : ChatBotIcon
                  : botSettings?.profilePictureUrl
                  ? botSettings?.profilePictureUrl
                  : ChatBotIcon
              }
              alt="bot-img"
              width={40}
              height={40}
              style={{ borderRadius: "50%" }}
            />
            <h1 className={`${isPopUp ? "popup-heading" : ""}`}>
              {isPopUp
                ? `${chatbotDisplayName}`
                : botSettings?.chatbotDisplayName}
            </h1>
          </div>

          <div className="action-btns">
            {/* <Image src={refreshBtn} alt="refresh-btn" onClick={refreshChat} /> */}
            {/* <Image src={exportBtn} alt="export-btn" /> */}
            <Icon
              Icon={RefreshBtn}
              click={refreshChat}
              className={botSettings?.theme === "dark" ? "color-white" : ""}
            />

            {/* this is used for printing the chats initially it will be hidden but on print it will be visible*/}
            <PrintingChats
              ref={tempRef}
              messages={messages}
              messagesTime={messagesTime}
            />

            {/* If chatbot is opened from popup then add the close embed bot button */}
            {isPopUp && (
              <Icon
                Icon={CloseEmbedBotIcon}
                click={() => {
                  const btn = document.getElementById("chat-frame-widget");
                  // Send a message to the parent
                  window.parent.postMessage("disable-iframe", "*");
                }}
                className={botSettings?.theme === "dark" ? "color-white" : ""}
              />
            )}

            {/* If the chatbot is embeded remove the print chat button */}
            {!isPopUp && (
              <ReactToPrint
                trigger={() => {
                  return (
                    <button style={{ border: "none", background: "none" }}>
                      <Icon
                        Icon={ExportBtn}
                        className={
                          botSettings?.theme === "dark" ? "color-white" : ""
                        }
                      />
                    </button>
                  );
                }}
                content={() => tempRef.current}
              />
            )}
          </div>
        </div>

        <hr />
        <div
          className={`conversation-container ${
            innerWidth && "embed-conversation-container"
          }`}
          ref={chatWindowRef}
        >
          {messages.map((message: any, index: any) => {
            if (message.role == "assistant")
              return (
                <React.Fragment key={index}>
                  <div
                    className="assistant-message-container"
                    style={{
                      marginTop:
                        `${messagesTime[index]?.messageType}` === "initial"
                          ? "10px"
                          : "0",

                      position:
                        messagesTime[index]?.messageType === "initial"
                          ? "unset"
                          : "relative",
                    }}
                  >
                    {/* <div
                      className="assistant-message"
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        backgroundColor:
                          botSettings?.theme === "dark" ? "#353945" : "",
                        color: botSettings?.theme === "dark" ? "#FCFCFD" : "",
                      }}
                      // dangerouslySetInnerHTML={{
                      //   __html: message.content,
                      // }}
                    > */}
                    <MarkdownPreview
                      source={message.content}
                      // className="assistant-message"
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        backgroundColor:
                          botSettings?.theme === "dark" ? "#353945" : "",
                        color: botSettings?.theme === "dark" ? "#FCFCFD" : "",
                      }}
                      // style={{ padding: 16 }}
                    />
                    {/* </div> */}
                    {messagesTime[index]?.messageType !== "initial" && (
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
                    style={{
                      backgroundColor: botSettings?.userMessageColor
                        ? botSettings?.userMessageColor
                        : userMessageColor,
                    }}
                  >
                    {message.content}
                  </div>
                  <div className="time">{messagesTime[index]?.messageTime}</div>
                </div>
              );
          })}
          {loading == false &&
            // isPopUp &&
            !isLeadFormSubmitted &&
            !userDetails?.isLeadFormSubmitted &&
            !skipLeadForm &&
            !cookies?.[`leadDetails-${chatbot.id}`] &&
            messages.length > 1 &&
            messages.length % 2 == 1 &&
            userLeadDetails !== "do-not-collect" &&
            botSettings?.userDetails !== "do-not-collect" && (
              <div className="lead-generation-container">
                <h2>
                  {leadTitle ? leadTitle : "Let us know how to contact you"}
                </h2>

                <div className="collect-details">
                  {leadFields?.name.isChecked == true && (
                    <div className="detail-field">
                      <p className="title">
                        {leadFields?.name.value
                          ? leadFields?.name.value
                          : "Name"}
                      </p>
                      <input
                        type="text"
                        className="title-input"
                        placeholder="Enter your name"
                        onChange={(e: any) => {
                          setLeadDetails({
                            ...leadDetails,
                            name: e.target.value,
                          });
                          setLeadError("");
                          setNameError("");
                        }}
                        onBlur={() => {
                          if (
                            leadFields?.name.isChecked == true &&
                            leadDetails.name === ""
                          ) {
                            setNameError("Please enter your name");
                            return;
                          }
                        }}
                        value={leadDetails.name}
                      />
                      <div className="lead-error">
                        <p>{nameError}</p>
                      </div>
                    </div>
                  )}

                  {leadFields?.email.isChecked == true && (
                    <div className="detail-field">
                      <p className="title">
                        {leadFields?.email.value
                          ? leadFields?.email.value
                          : "Email Address"}
                      </p>
                      <input
                        type="email"
                        className="title-input"
                        placeholder="Enter your email address"
                        onChange={(e) => {
                          setLeadDetails({
                            ...leadDetails,
                            email: e.target.value,
                          });
                          setLeadError("");
                          setEmailError("");
                        }}
                        onBlur={() => {
                          if (
                            leadFields?.email.isChecked == true &&
                            leadDetails.email === ""
                          ) {
                            setEmailError("Please enter your email");
                            return;
                          }
                          const pattern =
                            /^\w+([-+.']\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*$/;
                          //   message: "Invalid email address format",

                          /// validate email
                          const result = leadDetails.email?.match(pattern);

                          if (!result) {
                            setEmailError("Invalid email format.");
                          }
                        }}
                        value={leadDetails?.email}
                      />
                      <div className="lead-error">
                        <p>{emailError}</p>
                      </div>
                    </div>
                  )}

                  {leadFields?.number.isChecked == true && (
                    <div className="detail-field">
                      <p className="title">
                        {leadFields?.number.value
                          ? leadFields?.number.value
                          : "Phone Number"}
                      </p>
                      {/* <input
                                id="mobile_code"
                                type="text"
                                className="title-input"
                                placeholder="Enter your phone number..."
                                onChange={(e) => {
                                  setLeadDetails({
                                    ...leadDetails,
                                    number: e.target.value,
                                  });
                                  setLeadError("");
                                }}
                                value={leadDetails?.number}
                              /> */}

                      <PhoneInput
                        country={
                          botDetails?.userCountry
                            ? botDetails?.userCountry
                            : userLocation
                        }
                        value={mobileNumber}
                        placeholder="Enter your phone number"
                        onChange={(phone, country: any) => {
                          // Process to format the phone number
                          const phoneWithoutCode = phone.startsWith(
                            `${country?.dialCode}`
                          )
                            ? phone.slice(`${country?.dialCode}`.length)
                            : phone;
                          const formattedPhone: any = `+${country?.dialCode}-${phoneWithoutCode}`;

                          setMobileNumber(phone);

                          setLeadDetails({
                            ...leadDetails,
                            number: formattedPhone,
                          });
                          setLeadError("");
                          setValidNumberError("");
                        }}
                        // onChange={(phone, country) =>
                        //   handlePhoneChange(phone, country)
                        // }
                        enableLongNumbers={true}
                        isValid={(value: any, country: any) =>
                          // isValidPhoneNumber(value, country)
                          getPhoneNumberLength(value, country)
                        }
                        onBlur={() => {
                          if (
                            leadFields?.number.isChecked == true &&
                            !isNumberValid
                          ) {
                            setValidNumberError("Please enter valid number");
                            return;
                          }
                        }}
                      />
                      <div className="lead-error">
                        <p>{validNumberError}</p>
                      </div>
                    </div>
                  )}
                  {leadError && (
                    <div className="lead-error">
                      <p>{leadError}</p>
                    </div>
                  )}
                </div>

                <div className="submit-skip-btn">
                  <Button
                    type="primary"
                    className="save-btn"
                    onClick={submitLeadDetail}
                  >
                    Submit
                  </Button>

                  {userLeadDetails !== "mandatory" &&
                    botSettings?.userDetails !== "mandatory" && (
                      <Button
                        type="text"
                        className="skip-btn"
                        onClick={skipLeadDetail}
                      >
                        Skip
                      </Button>
                    )}
                </div>
              </div>
            )}
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
              {/* <div
                className="assistant-message"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  backgroundColor:
                    botSettings?.theme === "dark" ? "#353945" : "",
                  color: botSettings?.theme === "dark" ? "#FCFCFD" : "",
                }}
                // dangerouslySetInnerHTML={{
                //   __html: response.concat("<b> |</b>"),
                // }}
              /> */}
              <MarkdownPreview
                source={response}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  backgroundColor:
                    botSettings?.theme === "dark" ? "#353945" : "",
                  color: botSettings?.theme === "dark" ? "#FCFCFD" : "",
                }}
              />
            </div>
          )}
        </div>
        <div className="suggested-messages">
          {/* if chatbot is opened from popup render the suggested messages from state */}
          {suggestedMessages?.map((message: any, index: any) => {
            return (
              <div
                className="message"
                key={index}
                onClick={() => setUserQuery(message)}
              >
                {message}
              </div>
            );
          })}
          {botSettings?.suggestedMessages?.map((message: any, index: any) => {
            return (
              <div
                className="message"
                key={index}
                onClick={() => setUserQuery(message)}
              >
                {message}
              </div>
            );
          })}
        </div>
        <a
          className="powered-by"
          target="_blank"
          href={`${
            chatbot?.id === "35910e5d-d751-4ba0-a52c-50d4c9302352"
              ? "https://www.creolestudios.com/?utm_source=ASGTG+Website&utm_medium=referral&utm_campaign=ASGTG"
              : "https://torri.ai"
          }`}
        >
          {chatbot?.id === "35910e5d-d751-4ba0-a52c-50d4c9302352"
            ? "Powered by Creole Studios"
            : "Powered by Torri.AI"}
        </a>
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
            placeholder={
              // isPopUp
              //   ? `Message ${chatbotName}`
              //   : botSettings?.messagePlaceholder
              // isPopUp
              //   ? `Message ${chatbotName}`
              //   : botSettings?.messagePlaceholder
              botSettings?.messagePlaceholder
                ? botSettings?.messagePlaceholder
                : messagePlaceholder
            }
            value={userQuery}
            disabled={loading ? true : false}
          />
          <div className="action-btns">
            {/* <button className="web-search-button">
                    <Icon Icon={WebSearchIcon}></Icon>
                    Search
                  </button> */}
            <div
              className="send-record-container"
              style={{
                backgroundColor: botSettings?.userMessageColor
                  ? botSettings?.userMessageColor
                  : userMessageColor,
              }}
            >
              {/*           
                  {(MicrophoneState.Open === microphoneState && !isPopUp) ||
                  (MicrophoneState.Open === microphoneStatePopup && isPopUp) ? (
                    <>
                      <Icon
                        Icon={CloseIcon}
                        click={() => {
                          if (
                            (microphoneState === MicrophoneState.Open && !isPopUp) ||
                            (microphoneStatePopup === MicrophoneState.Open && isPopUp)
                          )
                            stopTranscription();
                        }}
                      />
                      <span
                        style={{
                          color: botSettings?.theme === "dark" ? "#FCFCFD" : "#fff",
                        }}
                      >
                        {recordingDuration}
                      </span>
                    </>
                  ) : (
                    <Icon
                      Icon={MicIcon}
                      click={() => {
                        if (
                          (microphoneState === MicrophoneState.Ready && !isPopUp) ||
                          (microphoneStatePopup === MicrophoneState.Ready && isPopUp)
                        )
                          startTranscription();
                      }}
                    />
                  )}
       */}
              <button
                className="icon"
                onClick={() => getReply("click")}
                style={{
                  backgroundColor: botSettings?.userMessageColor
                    ? botSettings?.userMessageColor
                    : userMessageColor,
                }}
                disabled={loading ? true : false}
              >
                <Image src={sendChatIcon} alt="send-chat-icon" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ChatV3;
