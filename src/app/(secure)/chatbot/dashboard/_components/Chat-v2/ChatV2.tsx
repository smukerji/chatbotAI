import React, { useContext, useEffect, useRef, useState } from "react";
import { useCookies } from "react-cookie";
import "../Chat/chat.scss";
import Image from "next/image";
import { Button, Slider, message } from "antd";
import ChatbotNameModal from "../../../../../_components/Modal/ChatbotNameModal";
import { getDate } from "../../../../../_helpers/client/getTime";
import copyIcon from "../../../../../../../public/svgs/copy-icon.svg";
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
import { parsePhoneNumber } from "awesome-phonenumber";
import CloseEmbedBotIcon from "@/assets/svg/CloseEmbedBotIcon";
import { AssistantStream } from "openai/lib/AssistantStream.mjs";
import { AssistantStreamEvent } from "openai/resources/beta/assistants.mjs";
import CloseIcon from "@/assets/svg/CloseIcon";
import MicIcon from "@/assets/svg/MicIcon";
import {
  LiveTranscriptionEvent,
  LiveTranscriptionEvents,
  useDeepgram,
} from "@/app/_helpers/client/Context/DeepgramContext";
import {
  MicrophoneEvents,
  MicrophoneState,
  useMicrophone,
} from "@/app/_helpers/client/Context/MicrophoneContext";

function ChatV2({
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
  functionCallHandler = () => Promise.resolve(""),

  /* microphone handling states for popup */
  setupMicrophonePopup,
  stopMicrophonePopup,
  startMicrophonePopup,
  microphoneStatePopup,
  microphonePopup,

  /* deepgram handling states for popup */
  connectToDeepgramPopup,
  connectionStatePopup,
  connectionPopup,
  disconnectFromDeepgramPopup,
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

  // const deepgram: any = useDeepgram();
  //// deepgram & mic context
  const {
    connection,
    connectToDeepgram,
    connectionState,
    disconnectFromDeepgram,
  } = useDeepgram();

  // const Microphone= useMicrophone();
  const {
    setupMicrophone,
    microphone,
    startMicrophone,
    microphoneState,
    stopMicrophone,
  }: any = useMicrophone();

  /// deep gram action states
  const [recordingDuration, setRecordingDuration] = useState("0:00");
  let timer = useRef<any>(null);
  const [language, setLanguage] = useState("en");

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
          sessionID: threadID,
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

  const onChange = (newValue: number) => {
    botSettingContext?.handleChange("temperature")(newValue);
  };

  /// handle the user message stream
  const handleReadableStream = (stream: AssistantStream) => {
    // messages
    stream.on("textCreated", handleTextCreated);
    stream.on("textDelta", handleTextDelta);

    // // image
    // stream.on("imageFileDone", handleImageFileDone);

    // // code interpreter
    // stream.on("toolCallCreated", toolCallCreated);
    // stream.on("toolCallDelta", toolCallDelta);

    // events without helpers yet (e.g. requires_action and run.done)
    stream.on("event", (event) => {
      if (event.event === "thread.run.requires_action")
        handleRequiresAction(event);
      if (event.event === "thread.run.completed") {
        console.log("Thread Run Completed >>>>>>");

        /// setting the response time when completed
        setMessagesTime((prev: any) => {
          storeHistory(prev);
          return [...prev];
        });
      }
    });
  };

  // handleRequiresAction - handle function call
  const handleRequiresAction = async (
    event: AssistantStreamEvent.ThreadRunRequiresAction
  ) => {
    const runId = event.data.id;
    const toolCalls: any =
      event?.data?.required_action?.submit_tool_outputs.tool_calls;

    const userID = !isPopUp ? cookies.userId : userId;

    // loop over tool calls and call function handler
    const toolCallOutputs = await Promise.all(
      toolCalls.map(async (toolCall: any) => {
        const result = await functionCallHandler(
          toolCall,
          chatbot.id,
          userID,
          messages
        );
        return { output: result, tool_call_id: toolCall.id };
      })
    );
    // setInputDisabled(true);
    submitActionResult(runId, toolCallOutputs);
  };

  const submitActionResult = async (runId: any, toolCallOutputs: any) => {
    const response: any = await fetch(
      `/api/assistants/threads/${threadID}/actions`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          runId: runId,
          toolCallOutputs: toolCallOutputs,
        }),
      }
    );
    const stream = AssistantStream.fromReadableStream(response.body);
    handleReadableStream(stream);
  };

  // textCreated - create new assistant message
  const handleTextCreated = () => {
    setLoading(false);
    appendMessage("assistant", "");
  };

  // textDelta - append text to last assistant message
  const handleTextDelta = (delta: any) => {
    if (delta.value != null) {
      appendToLastMessage(delta.value);
    }
    if (delta.annotations != null) {
      annotateLastMessage(delta.annotations);
    }
  };

  // // imageFileDone - show image in chat
  // const handleImageFileDone = (image: any) => {
  //   appendToLastMessage(`\n![${image.file_id}](/api/files/${image.file_id})\n`);
  // };

  // // toolCallCreated - log new tool call
  // const toolCallCreated = (toolCall) => {
  //   if (toolCall.type != "code_interpreter") return;
  //   appendMessage("code", "");
  // };

  // // toolCallDelta - log delta and snapshot for the tool call
  // const toolCallDelta = (delta, snapshot) => {
  //   if (delta.type != "code_interpreter") return;
  //   if (!delta.code_interpreter.input) return;
  //   appendToLastMessage(delta.code_interpreter.input);
  // };

  /// append the message
  const appendMessage = (role: string, text: string) => {
    setMessages((prevMessages: [{ role: string; content: string }]) => [
      ...prevMessages,
      { role, content: text },
    ]);
    /// setting the response time when completed
    setMessagesTime((prev: any) => [
      ...prev,
      {
        role,
        content: text,
        messageTime: getDate(),
      },
    ]);
  };

  const appendToLastMessage = (text: string) => {
    setMessages((prevMessages: [{ role: string; content: string }]) => {
      const lastMessage = prevMessages[prevMessages.length - 1];
      const updatedLastMessage = {
        ...lastMessage,
        content: lastMessage.content + text,
      };
      return [...prevMessages.slice(0, -1), updatedLastMessage];
    });
    0;

    /// setting the response time when completed
    setMessagesTime((prev: any) => {
      const lastMessage = prev[prev.length - 1];
      const updatedLastMessage = {
        ...lastMessage,
        content: lastMessage.content + text,
      };
      return [...prev.slice(0, -1), updatedLastMessage];
    });
  };

  const annotateLastMessage = (annotations: any) => {
    setMessages((prevMessages: any) => {
      const lastMessage = prevMessages[prevMessages.length - 1];
      const updatedLastMessage = {
        ...lastMessage,
      };
      annotations.forEach((annotation: any) => {
        if (annotation.type === "file_path") {
          updatedLastMessage.content = updatedLastMessage.content.replaceAll(
            annotation.text,
            `/api/files/${annotation.file_path.file_id}`
          );
        }
      });
      return [...prevMessages.slice(0, -1), updatedLastMessage];
    });
  };

  /// send the user message
  const sendMessage = async (text: string) => {
    const response: any = await fetch(
      `/api/assistants/threads/${threadID}/messages`,
      {
        method: "POST",
        body: JSON.stringify({
          content: text,
          assistantId: chatbot?.id,
        }),
      }
    );
    const stream = AssistantStream.fromReadableStream(response.body);
    handleReadableStream(stream);
  };

  /// get the chatbase response
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
          // setLoading(true);
          /// get similarity search
          // const response: any = await fetch(
          //   `${process.env.NEXT_PUBLIC_WEBSITE_URL}api/pinecone`,
          //   {
          //     method: "POST",
          //     body: JSON.stringify({
          //       userQuery,
          //       chatbotId: chatbot?.id,
          //       messages,
          //       // userId: cookies.userId,
          //       //// default chatbot set
          //       userId: !isPopUp ? cookies.userId : userId,
          //     }),
          //   }
          // );
          // /// parse the response and extract the similarity results
          // const respText = await response.text();
          // const similaritySearchResults = respText;
          // console.log("similaritySearchResults", similaritySearchResults);

          await sendMessage(userQuery);

          /// get response from backend in streaming
          //   const responseFromBackend: any = await fetch(
          //     `${process.env.NEXT_PUBLIC_WEBSITE_URL}api/chat`,
          //     {
          //       method: "POST",
          //       body: JSON.stringify({
          //         similaritySearchResults,
          //         messages,
          //         userQuery,
          //         chatbotId: chatbot?.id,
          //         //// default chatbot set
          //         userId: !isPopUp ? cookies.userId : userId,
          //       }),
          //       next: { revalidate: 0 },
          //     }
          //   );
          //   if (responseFromBackend.status === 429) {
          //     // Handle the "Too Many Requests" error
          //     const error = await responseFromBackend.text();
          //     message.error(error);
          //     return; // Exit early
          //   }
          //   if (!responseFromBackend.ok) {
          //     // Handle other possible errors
          //     console.error("An error occurred:", responseFromBackend.statusText);
          //     alert("An error occurred. Please try again.");
          //     return; // Exit early
          //   }
          //   let resptext = "";
          //   const reader = responseFromBackend.body
          //     .pipeThrough(new TextDecoderStream())
          //     .getReader();
          //   while (true) {
          //     const { value, done } = await reader.read();
          //     if (done) {
          //       /// setting the response when completed
          //       setMessages((prev: any) => [
          //         ...prev,
          //         { role: "assistant", content: resptext },
          //       ]);
          //       /// setting the response time when completed
          //       setMessagesTime((prev: any) => [
          //         ...prev,
          //         {
          //           role: "assistant",
          //           content: resptext,
          //           messageTime: getDate(),
          //         },
          //       ]);
          //       /// store history
          //       const userLatestQuery = {
          //         role: "user",
          //         content: userQuery,
          //         messageTime: tempUserMessageTime,
          //       };
          //       const gptLatestResponse = {
          //         role: "assistant",
          //         content: resptext,
          //         messageTime: getDate(),
          //       };
          //       storeHistory(userLatestQuery, gptLatestResponse);
          //       setResponse("");
          //       setLoading(false);
          //       break;
          //     }
          //     resptext += value;
          //     setResponse(resptext);
          //   }
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

  /// refresh the chat window
  const refreshChat = () => {
    setMessages([]);
    setMessagesTime([]);
    setLeadDetails({
      name: "",
      email: "",
      number: "",
    });

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
    setThreadId();
    setSessionStartDate(getDate());
  };

  /// to copy chatbot Id
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(chatbot?.id);
      message.success("ID copied to clipboard");
    } catch (err: any) {
      message.error("Copy Failed!", err.message);
    }
  };

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

  /// function for skipping lead detail

  const skipLeadDetail = () => {
    setSkipLeadForm(true);
  };

  // For checking whether iframe is loaded or not
  useEffect(() => {
    // Create a URLSearchParams object from the current URL's search string
    const params = new URLSearchParams(window.location.search);

    // Get the value of the 'guide' query parameter
    const guideValue = params.get("source");

    const iframeLoaded = guideValue == "web";
    setiFrameLoaded(iframeLoaded);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setInnerWidth(
        isPopUp && window.innerWidth < 767 && window.innerWidth != 400
      );
    };

    handleResize(); // Set initial window width
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setInnerWidth(
        isPopUp && window.innerWidth < 767 && window.innerWidth != 400
      );
    };

    /// setting the microphone
    if (!isPopUp) {
      setupMicrophone();
    } else {
      setupMicrophonePopup();
    }

    handleResize(); // Set initial window width
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  useEffect(() => {
    /// when microphone is ready connect to deepgram
    if (microphoneState === MicrophoneState.Ready && !isPopUp) {
      connectToDeepgram({
        model: "nova-2",
        interim_results: true,
        smart_format: true,
        filler_words: true,
        utterance_end_ms: 3000,
        language: language,
      });
    } else if (microphoneStatePopup === MicrophoneState.Ready && isPopUp) {
      connectToDeepgramPopup({
        model: "nova-2",
        interim_results: true,
        smart_format: true,
        filler_words: true,
        utterance_end_ms: 3000,
        language: language,
      });
    }
  }, [
    microphoneState == MicrophoneState.Ready && !isPopUp,
    microphoneStatePopup == MicrophoneState.Ready && isPopUp,
    language,
  ]);

  // Define onTranscript and onData outside the functions so they are accessible
  const onTranscript = (data: LiveTranscriptionEvent) => {
    const { is_final: isFinal, speech_final: speechFinal } = data;
    let thisCaption = data.channel.alternatives[0].transcript;

    if (isFinal && speechFinal && thisCaption !== "") {
      setUserQuery((caption) => {
        return caption + " " + thisCaption;
      });
    }
  };

  const onData = (e: BlobEvent) => {
    if (e.data.size > 0) {
      if (!isPopUp) {
        connection?.send(e.data);
      } else {
        connectionPopup?.send(e.data);
      }
    }
  };

  /// keep the connection alive once it starts
  useEffect(() => {
    /// run the interval every 10 seconds to keep the connection alive
    const interval = setInterval(() => {
      if (!isPopUp) {
        if (connection?.isConnected()) {
          connection.keepAlive();
        }
      } else if (connectionPopup?.isConnected()) {
        connectionPopup.keepAlive();
      }
    }, 8000);

    return () => clearInterval(interval);
  }, [connection, connectionPopup]);

  const startTranscription = async () => {
    if (!microphone && !isPopUp) return;
    if (!microphonePopup && isPopUp) return;
    if (!connection && !isPopUp) return;
    if (!connectionPopup && isPopUp) return;

    if (!isPopUp) {
      startMicrophone();
    } else {
      startMicrophonePopup();
    }

    /// start the timer to display the time
    /// format the time as minutes and seconds
    let minutes = 0;
    let seconds = 0;

    console.log("startt transcriptionnnnn");

    timer.current = setInterval(() => {
      seconds += 1;
      if (seconds == 60) {
        minutes += 1;
        seconds = 0;
      }

      setRecordingDuration(`${minutes}:${seconds}`);
    }, 1000);

    // if (connectionState === LiveConnectionState.OPEN) {

    if (!isPopUp) {
      microphone.addEventListener(MicrophoneEvents.DataAvailable, onData);
      connection.addListener(LiveTranscriptionEvents.Transcript, onTranscript);
    } else {
      microphonePopup.addEventListener(MicrophoneEvents.DataAvailable, onData);
      connectionPopup.addListener(
        LiveTranscriptionEvents.Transcript,
        onTranscript
      );
    }
    // }
  };

  const stopTranscription = () => {
    // if (connection && !isPopUp) {
    //   connection.removeListener(
    //     LiveTranscriptionEvents.Transcript,
    //     onTranscript
    //   );
    // } else if (connectionPopup && isPopUp) {
    //   connectionPopup.removeListener(
    //     LiveTranscriptionEvents.Transcript,
    //     onTranscript
    //   );
    // }

    if (microphone && !isPopUp) {
      microphone.removeEventListener(MicrophoneEvents.DataAvailable, onData);
    } else if (microphonePopup && isPopUp) {
      microphonePopup.removeEventListener(
        MicrophoneEvents.DataAvailable,
        onData
      );
    }

    /// stop the timer and clear the interval
    setRecordingDuration("0:00");
    clearInterval(timer.current);

    if (!isPopUp) {
      stopMicrophone();
    } else {
      stopMicrophonePopup();
    }
  };

  return (
    <div className={`chat-container ${innerWidth && "embed-chat-container"}`}>
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
              <span style={{ width: "auto" }}>{botSettings?.temperature}</span>
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
                  __html: response.concat("<b> |</b>"),
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
{/*           <div
            className="send-record-container"
            style={{
              backgroundColor:
                botSettings?.userMessageColor &&
                microphoneState === MicrophoneState.Open
                  ? botSettings?.userMessageColor
                  : userMessageColor,
            }}
          >
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
  );
}

export default ChatV2;
