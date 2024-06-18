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
import { Button, Modal, Slider, message } from "antd";
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
import ChatBotIcon from "../../../../../../../public/create-chatbot-svgs/ChatBotIcon.svg";
import { UserDetailsContext } from "../../../../../_helpers/client/Context/UserDetailsContext";
import ReactToPrint from "react-to-print";
import { PrintingChats } from "../Printing-Chats/Printing";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import {
  AUTHORIZATION_FAILED,
  JWT_EXPIRED,
} from "../../../../../_helpers/errorConstants";
import { useRouter } from "next/navigation";
import CustomModal from "../CustomModal/CustomModal";

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

  const [cookies, setCookies] = useCookies(["userId"]);

  /// storing the input value
  const [userQuery, setUserQuery] = useState("");

  /// chat base response
  const [response, setResponse] = useState("");

  /// loading state
  const [loading, setLoading] = useState(false);

  /// skip leading form
  const [skipLeadForm, setSkipLeadForm] = useState(false);

  /// isLeadform submitted
  const [isLeadFormSubmitted, setIsLeadFormSubmitted] = useState(false);
  const [leadError, setLeadError] = useState("");

  const chatWindowRef: any = useRef(null);

  /// chatbot messages feedback pop up state
  const [open, setOpen] = useState(false);
  const [feedbackText, setfeedbackText] = useState("");
  const [feedbackIndex, setFeedbackIndex] = useState(0);
  const [feedbackStatus, setfeedbackStatus] = useState("");

  /// lead form errors
  const [emailError, setEmailError] = useState("");
  const [numberError, setNumberError] = useState("");
  const [nameError, setNameError] = useState("");

  /// chatbot lead section state
  const [leadDetails, setLeadDetails] = useState({
    name: "",
    email: "",
    number: "",
  });

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

  const handleUpgradePlan = () => {
    // setIsPlanNotification(false);
    router.push("/home/pricing");
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
  }, [response, messages, loading]);

  async function storeHistory(userLatestQuery: any, gptLatestResponse: any) {
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
          messages: [...messagesTime, userLatestQuery, gptLatestResponse],
          userId: !isPopUp ? cookies.userId : userId,
          sessionID,
          sessionStartDate,
          sessionEndDate: getDate(),
          initialMessageLength: botSettings?.initialMessage?.length,
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
      if (userQuery.trim() == "") {
        message.error("Please enter the message");
        return;
      }
      if (isPlanNotification) {
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

      const filterUserId = cookies?.userId ? cookies?.userId : userId;
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
          // setLoading(true);
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
                  // chatbot?.id === "123d148a-be02-4749-a612-65be9d96266c"
                  //   ? "651d111b8158397ebd0e65fb"
                  //   : chatbot?.id === "34cceb84-07b9-4b3e-ad6f-567a1c8f3557"
                  //   ? "65795294269d08529b8cd743"
                  //   : chatbot?.id === "f0893732-3302-46b2-922a-95e79ef3524c"
                  //   ? "651d111b8158397ebd0e65fb"
                  //   : chatbot?.id === "f8095ef4-6cd0-4373-a45e-8fe15cb6dd0f"
                  //   ? "6523fee523c290d75609a1fa"
                  cookies.userId ? cookies.userId : userId,
              }),
            }
          );

          /// parse the response and extract the similarity results
          const respText = await response.text();

          const similaritySearchResults = JSON.parse(respText).join("\n");

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
                  // chatbot?.id === "123d148a-be02-4749-a612-65be9d96266c"
                  //   ? "651d111b8158397ebd0e65fb"
                  //   : chatbot?.id === "34cceb84-07b9-4b3e-ad6f-567a1c8f3557"
                  //   ? "65795294269d08529b8cd743"
                  //   : chatbot?.id === "f0893732-3302-46b2-922a-95e79ef3524c"
                  //   ? "651d111b8158397ebd0e65fb"
                  //   : chatbot?.id === "f8095ef4-6cd0-4373-a45e-8fe15cb6dd0f"
                  //   ? "6523fee523c290d75609a1fa"
                  cookies.userId ? cookies.userId : userId,
              }),
              next: { revalidate: 0 },
            }
          );

          if (responseFromBackend.status === 429) {
            // Handle the "Too Many Requests" error
            const error = await responseFromBackend.text();
            message.error(error);
            return; // Exit early
          }

          if (!responseFromBackend.ok) {
            // Handle other possible errors
            console.error("An error occurred:", responseFromBackend.statusText);
            alert("An error occurred. Please try again.");
            return; // Exit early
          }

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
              const userLatestQuery = {
                role: "user",
                content: userQuery,
                messageTime: tempUserMessageTime,
              };
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
    // }
  }

  /// refresh the chat window
  const refreshChat = () => {
    setMessages([]);
    setMessagesTime([]);

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
    setSessionID(uuid());
    setSessionStartDate(getDate());
  };

  /// function to validate email
  // const checkEmail = (email: any) => {
  //   if (email == "") {
  //     return ;
  //   }
  //   setEmail(email);

  //   const pattern = /^\w+([-+.']\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*$/;
  //   //   message: "Invalid email address format",

  //   /// validate email
  //   const result = email?.match(pattern);

  //   if (!result) {
  //     setEmailMessage("Invalid email format.");
  //   } else {
  //     setEmailMessage("");
  //   }

  //   // const email.(pattern)
  // };

  // console.log(messageImages);

  /// to copy chatbot Id
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(chatbot?.id);
      message.success("ID copied to clipboard");
    } catch (err: any) {
      message.error("Copy Failed!", err.message);
    }
  };

  /// function for submitting lead
  const submitLeadDetail = async () => {
    setLeadError("");

    try {
      // if(emailError =)
      if (
        (leadFields?.name.isChecked == true && leadDetails.name === "") ||
        (leadFields?.email.isChecked == true && leadDetails.email === "") ||
        (leadFields?.number.isChecked == true && leadDetails.number === "")
      ) {
        setLeadError("Please, fill out all required  fields.");
        return;
      }

      if (nameError !== "" || emailError !== "" || numberError !== "") return;
      // if (leadFields?.name.isChecked == true && leadDetails.name === "") {
      //   setNameError("Please enter your name");
      //   return;
      // }

      // if (leadFields?.email.isChecked == true && leadDetails.email === "") {
      //   setNameError("Please enter your email");
      //   return;
      // }

      // if (leadFields?.number.isChecked == true && leadDetails.number === "") {
      //   setNameError("Please enter your number");
      //   return;
      // }

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_WEBSITE_URL}chatbot/api/lead`,
        {
          method: "POST",
          body: JSON.stringify({
            chatbotId: chatbot.id,
            userId: cookies.userId ? cookies.userId : userId,
            leadDetails: leadDetails,
          }),
          next: { revalidate: 0 },
        }
      );

      if (!res.ok) {
        throw await res.json();
      }
      /// displaying status
      const data = await res.json();

      // message.success(data?.message);
      setIsLeadFormSubmitted(true);
    } catch (error) {}
  };

  /// function for skipping lead detail

  const skipLeadDetail = () => {
    setSkipLeadForm(true);
  };

  return (
    <div className="chat-container">
      {!isPopUp && (
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
      )}
      {/* 
      <Modal
        title="Upgrade Now to create new Chatbots!"
        open={isPlanNotification}
        onCancel={() => {}}
        footer={[
          <Button key="submit" type="primary" onClick={handleUpgradePlan}>
            Upgrade Now
          </Button>,
        ]}
        closable={false}
        centered
        className="subscription-expire-popup"
        width={800}
      >
        <p>Upgrade now to access your chatbots!</p>
      </Modal> */}

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
              style={{ zIndex: isPlanNotification ? -1 : 0 }}
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
            <h1>
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

                      position:
                        messagesTime[index].messageType === "initial"
                          ? "unset"
                          : "relative",
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
            !skipLeadForm &&
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
                        country={"us"}
                        value={leadDetails?.number}
                        placeholder="Enter your phone number"
                        onChange={(phone) => {
                          setLeadDetails({
                            ...leadDetails,
                            number: phone,
                          });
                        }}
                      />
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
        <a className="powered-by" target="_blank" href="https://torri.ai">
          Powered by Torri.AI
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
  );
}

export default Chat;
