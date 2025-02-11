"use client";
import {
  LoadingOutlined,
  MessageOutlined,
  MoreOutlined,
} from "@ant-design/icons";
import {
  fromUnixTime,
  format
} from "date-fns";

import { Modal, Spin, message, Button } from "antd";
import React, { Suspense, useContext, useEffect, useState } from "react";
import { useCookies } from "react-cookie";
import "./chatbot.scss";
import Image from "next/image";
import noChatbotBg from "../../../../public/sections-images/common/no-chatbot-icon.svg";
// import gridIcon from "../../../../public/svgs/grid-icon.svg";
import GridLayout from "./_components/GridLayout";
import TableLayout from "./_components/TableLayout";
import DeleteModal from "./dashboard/_components/Modal/DeleteModal";
import ShareModal from "./dashboard/_components/Modal/ShareModal";
import { redirect, useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import dynamic from "next/dynamic";
import Link from "next/link";
import RenameModal from "./dashboard/_components/Modal/RenameModal";
import Icon from "../../_components/Icon/Icon";
import GridIcon from "../../../assets/svg/GridIcon";
import MenuIcon from "../../../assets/svg/MenuIcon";
import NewChatbotNameModal from "./dashboard/_components/Modal/NewChatbotNameModal";
import LimitReachedModal from "./dashboard/_components/Modal/LimitReachedModal";
import { CreateBotContext } from "../../_helpers/client/Context/CreateBotContext";
import { UserDetailsContext } from "../../_helpers/client/Context/UserDetailsContext";
import { JWT_EXPIRED } from "../../_helpers/errorConstants";
import axios from "axios";
import voiceAssistantPreview from "../../../../public/voiceBot/voice-bot-preview.svg";

import { CreateVoiceBotContext } from "../../_helpers/client/Context/VoiceBotContextApi";
import VoicebotTableLayout from "./_components/VoicebotTableLayout";
// import GridIcon from "../../as";

const antIcon = (
  <LoadingOutlined style={{ fontSize: 24, color: "black" }} spin />
);

const initialState = {
  firstMessage: "",
  transcriber: {
    provider: "deepgram",
    model: "nova-2",
    language: "en-IN",
    // smartFormat: false,
    languageDetectionEnabled: false,
    // keywords: [""],
    endpointing: 255,
  },
  model: {
    messages: [{ content: "default", role: "system" }],
    // tools: [
    //   {
    //     async: false,
    //     messages: [
    //       {
    //         type: "request-start",
    //         content: "",
    //         conditions: [{ value: "", operator: "eq", param: "" }],
    //       },
    //     ],
    //     type: "dtmf",
    //     function: {
    //       name: "",
    //       description: "",
    //       parameters: { type: "object", properties: {}, required: [""] },
    //     },
    //     server: { timeoutSeconds: 20, url: "", secret: "" },
    //   },
    // ],
    toolIds: [""],//we deleted this field in the backend
    provider: "openai",
    model: "gpt-4o",
    temperature: 0,
    // knowledgeBase: { provider: "canonical", topK: 5.5, fileIds: [""] },
    maxTokens: 300,
    emotionRecognitionEnabled: false,
    numFastTurns: 1,
  },
  voice: {
    fillerInjectionEnabled: false,
    provider: "azure",
    voiceId: "andrew",
    speed: 1.25,
    chunkPlan: {
      enabled: true,
      minCharacters: 10,
      punctuationBoundaries: [
        { value: "0", label: "。" },
        { value: "1", label: "，" },
      ], //need to update this beffore sending it to vapi server
      formatPlan: {
        enabled: true,
        numberToDigitsCutoff: 2025,
        // replacements: [{ type: "exact", key: "", value: "" }],
      },
    },
  },
  firstMessageMode: "assistant-speaks-first",
  llmRequestDelaySeconds: 0.1,
  responseDelaySeconds: 0.1,
  hipaaEnabled: false,
  // clientMessages: [],//need to update this before sending to the vapi server
  // serverMessages: [],//need to update this before sending to the vapi server
  silenceTimeoutSeconds: 30,
  maxDurationSeconds: 600,
  backgroundSound: "office",
  backchannelingEnabled: false,
  backgroundDenoisingEnabled: false,
  modelOutputInMessagesEnabled: false,
  transportConfigurations: [
    {
      provider: "twilio",
      timeout: 60,
      record: false,
      recordingChannels: "mono",
    },
  ],
  name: "",
  numWordsToInterruptAssistant: 0,

  voicemailDetection: {
    provider: "twilio",
    voicemailDetectionTypes: ["machine_end_beep", "machine_end_silence"],
    enabled: true,
    machineDetectionTimeout: 31,
    machineDetectionSpeechThreshold: 3500,
    machineDetectionSpeechEndThreshold: 2750,
    machineDetectionSilenceTimeout: 6000,
  },
  voicemailMessage: "",
  endCallMessage: "",
  // endCallPhrases: [""],
  metadata: {},
  // serverUrl: "",
  // serverUrlSecret: "",
  analysisPlan: {
    summaryPrompt: "",
    summaryRequestTimeoutSeconds: 10.5,
    structuredDataRequestTimeoutSeconds: 10.5,
    successEvaluationPrompt: "",
    successEvaluationRubric: "NumericScale",
    successEvaluationRequestTimeoutSeconds: 10.5,
    structuredDataPrompt: "",
    structuredDataSchema: {
      type: "object",
      properties: [
        "",
      ] /**this type is {} not [], [] is given for ui manage only. This need to refactor before the time value send to the vapi server */,
    },

    artifactPlan: {
      recordingEnabled: true,
      videoRecordingEnabled: false,
      recordingS3PathPrefix: "",
    }, //deleted
    messagePlan: {
      idleMessages:
        [] /**this need to be update before sending to the vapi server. */,
      idleMessageMaxSpokenCount: 5.5,
      idleTimeoutSeconds: 17.5,
    }, //delete
    startSpeakingPlan: {
      waitSeconds: 0.4,
      smartEndpointingEnabled: false,
      transcriptionEndpointingPlan: {
        onPunctuationSeconds: 0.1,
        onNoPunctuationSeconds: 1.5,
        onNumberSeconds: 0.5,
      },
    }, //deleted
    stopSpeakingPlan: { numWords: 0, voiceSeconds: 0.2, backoffSeconds: 1 }, //deleted
    monitorPlan: { listenEnabled: false, controlEnabled: false }, //deleted
    credentialIds: [""], //deleted
  },
};

function Chatbot() {
  const initialState = {
    firstMessage: "",
    transcriber: {
      provider: "deepgram",
      model: "nova-2",
      language: "en-IN",
      // smartFormat: false,
      languageDetectionEnabled: false,
      // keywords: [""],
      endpointing: 255,
    },
    model: {
      messages: [{ content: "default", role: "system" }],
      // tools: [
      //   {
      //     async: false,
      //     messages: [
      //       {
      //         type: "request-start",
      //         content: "",
      //         conditions: [{ value: "", operator: "eq", param: "" }],
      //       },
      //     ],
      //     type: "dtmf",
      //     function: {
      //       name: "",
      //       description: "",
      //       parameters: { type: "object", properties: {}, required: [""] },
      //     },
      //     server: { timeoutSeconds: 20, url: "", secret: "" },
      //   },
      // ],
      toolIds: [""], //we deleted this field in the backend
      provider: "openai",
      model: "gpt-4o",
      temperature: 0,
      // knowledgeBase: { provider: "canonical", topK: 5.5, fileIds: [""] },
      maxTokens: 300,
      emotionRecognitionEnabled: false,
      numFastTurns: 1,
    },
    voice: {
      fillerInjectionEnabled: false,
      provider: "azure",
      voiceId: "andrew",
      speed: 1.25,
      chunkPlan: {
        enabled: true,
        minCharacters: 10,
        punctuationBoundaries: [
          { value: "0", label: "。" },
          { value: "1", label: "，" },
        ], //need to update this beffore sending it to vapi server
        formatPlan: {
          enabled: true,
          numberToDigitsCutoff: 2025,
          // replacements: [{ type: "exact", key: "", value: "" }],
        },
      },
    },
    firstMessageMode: "assistant-speaks-first",
    llmRequestDelaySeconds: 0.1,
    responseDelaySeconds: 0.1,
    hipaaEnabled: false,
    // clientMessages: [],//need to update this before sending to the vapi server
    // serverMessages: [],//need to update this before sending to the vapi server
    silenceTimeoutSeconds: 30,
    maxDurationSeconds: 600,
    backgroundSound: "office",
    backchannelingEnabled: false,
    backgroundDenoisingEnabled: false,
    modelOutputInMessagesEnabled: false,
    transportConfigurations: [
      {
        provider: "twilio",
        timeout: 60,
        record: false,
        recordingChannels: "mono",
      },
    ],
    name: "",
    numWordsToInterruptAssistant: 0,

    voicemailDetection: {
      provider: "twilio",
      voicemailDetectionTypes: ["machine_end_beep", "machine_end_silence"],
      enabled: true,
      machineDetectionTimeout: 31,
      machineDetectionSpeechThreshold: 3500,
      machineDetectionSpeechEndThreshold: 2750,
      machineDetectionSilenceTimeout: 6000,
    },
    voicemailMessage: "",
    endCallMessage: "",
    // endCallPhrases: [""],
    metadata: {},
    // serverUrl: "",
    // serverUrlSecret: "",
    analysisPlan: {
      summaryPrompt: "",
      summaryRequestTimeoutSeconds: 10.5,
      structuredDataRequestTimeoutSeconds: 10.5,
      successEvaluationPrompt: "",
      successEvaluationRubric: "NumericScale",
      successEvaluationRequestTimeoutSeconds: 10.5,
      structuredDataPrompt: "",
      structuredDataSchema: {
        type: "object",
        properties: [
          "",
        ] /**this type is {} not [], [] is given for ui manage only. This need to refactor before the time value send to the vapi server */,
      },

      artifactPlan: {
        recordingEnabled: true,
        videoRecordingEnabled: false,
        recordingS3PathPrefix: "",
      }, //deleted
      messagePlan: {
        idleMessages:
          [] /**this need to be update before sending to the vapi server. */,
        idleMessageMaxSpokenCount: 5.5,
        idleTimeoutSeconds: 17.5,
      }, //delete
      startSpeakingPlan: {
        waitSeconds: 0.4,
        smartEndpointingEnabled: false,
        transcriptionEndpointingPlan: {
          onPunctuationSeconds: 0.1,
          onNoPunctuationSeconds: 1.5,
          onNumberSeconds: 0.5,
        },
      }, //deleted
      stopSpeakingPlan: { numWords: 0, voiceSeconds: 0.2, backoffSeconds: 1 }, //deleted
      monitorPlan: { listenEnabled: false, controlEnabled: false }, //deleted
      credentialIds: [""], //deleted
    },
  };

  const { status } = useSession();
  const router = useRouter();
  const params: any = useSearchParams();

  const interactionFrom = params.get("interactionFrom") === "true";

  const botContext: any = useContext(CreateBotContext);
  const botDetails = botContext?.createBotInfo;

  /// get userDetails context
  const userDetailContext: any = useContext(UserDetailsContext);
  const userDetails = userDetailContext?.userDetails;

  /// state to store user plan
  // const [userDetails, setUserDetails]: any = useState({});

  //manage limit model
  const [openLimitModal, setOpenLimitModel] = useState(false);

  /// chatbots details state
  const [chatbotData, setChatbotData] = useState([]);
  const [cookies, setCookie] = useCookies(["userId"]);

  /// loading state
  const [loading, setLoading] = useState(false);
  const [voiceBotLoading, setVoiceBotLoading] = useState(false);

  /// state for showing the chabot list
  const [listType, setListType]: any = useState("grid");

  // state for showing the voicebot list
  const [voiceListType, setVoiceListType]: any = useState("grid");

  const [chatbotId, setChatbotId] = useState("");

  /// managing share chatbot
  const [openShareModal, setOpenShareModal] = useState(false);

  /**
   *
   * description Voicebot properties
   *
   *
   */

  const voiceBotContextData: any = useContext(CreateVoiceBotContext);
  const voicebotDetails = voiceBotContextData.state;

  /**
   * states goes here
   */
  const [isVoiceBotActived, setIsVoiceBotActived] = useState(false);

  const [voiceAssistantList, setVoiceAssistantList] = useState([]);

  /**
   * Handler goes heres
   */

  const voiceBotActiveDeactiveHandler = (activeValue: boolean) => {
    setIsVoiceBotActived(activeValue);
  };

  const getAllVoiceAssistantData = async () => {
    setVoiceBotLoading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_WEBSITE_URL}voicebot/dashboard/api/assistant?userId=${cookies.userId}`,
        {
          method: "GET",
        }
      );
      const data = await res.json();

      
      setVoiceAssistantList(data?.assistants);
    } catch (error: any) {
      console.log("Error in fetching voice assistant data", error);
      message.error("Error in fetching voice assistant data");
    } finally {
      setVoiceBotLoading(false);
    }
  };

  const getDate =(ts:number) => {
    if (!ts) return "";

    const date = fromUnixTime(ts);

    return format(date, "PP");
  }

  const selectedAssistantHandler = (assistantInfo: any) => {
    voiceBotContextData.setAssistantInfo(assistantInfo);

    voiceBotContextData.setState(JSON.parse(JSON.stringify(initialState)));
    // voiceBotContextData.setAssistantMongoId(assistantInfo._id);
    // if(assistantInfo?.vapiId){
    //   voiceBotContextData.setAssistantVapiId(assistantInfo.vapiId);
    // }
    voiceBotContextData.setCurrentAssistantPage(0);
    router.push("/voicebot/dashboard?interaction=voicebot");
  };

  /**
   * UseEffect goes here
   */

  useEffect(() => {
    const fetchData = async () => {
      await getAllVoiceAssistantData();
    };

    fetchData();
  }, []);

  /**
   *
   * voice bot property ended
   *
   */

  /// state for opening menu for the chabot list
  const [openMenu, setOpenMenu]: any = useState(null);
  const changeMenu = (value: any) => {
    setOpenMenu(value);
  };

  const [changeFlag, setChangeFlag] = useState(false);

  /// managing delete chatbot
  const [openDeleteModal, setOpenDeleteModal] = useState(false);

  /// managing renaming chatbot
  const [openRenameModal, setOpenRenameModal] = useState(false);

  /// managing new chatbot name modal
  const [openNewChatbotNameModal, setOpenNewChatbotNameModal] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isPlanNotification, setIsPlanNotification] = useState(false);

  // const showModal = async () => {
  //   const checkPlan = await axios.put(
  //     `${process.env.NEXT_PUBLIC_WEBSITE_URL}home/pricing/stripe-payment-gateway`,
  //     { u_id: cookies.userId }
  //   );
  //   if (checkPlan.data.msg == 0) {
  //     // setIsModalOpen(true);
  //     window.location.href = 'http://localhost:3000/chatbot'
  //   }
  //   // setIsModalOpen(true);
  // };

  const getUser = async () => {
    const response = await axios.get(
      `${process.env.NEXT_PUBLIC_WEBSITE_URL}api/user?userId=${cookies.userId}`
    );

    /// if user does not have any plan then redirect to create-first-bot page
    if (!response.data.user.planId && response.data.user.voiceBotCount <= 0) {

      router.push("/create-first-assistant");
    }
    setUser(response.data.user);
  };

  const handleCancel = () => {
    // router.push("home/pricing");
    // setIsModalOpen(false);
  };

  /// retrive the chatbots details
  useEffect(() => {
    if(interactionFrom){
      setIsVoiceBotActived(true);
    }
    getUser();
    const fetchData = async () => {
      try {
        setLoading(true);
        /// get chatbot details
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_WEBSITE_URL}chatbot/api`,
          {
            method: "POST",
            body: JSON.stringify({ userId: cookies.userId }),
            next: { revalidate: 0 },
          }
        );
        const data = await response.json();

        /// check if session is expired
        if (data.message == JWT_EXPIRED) {
          window.location.href = "/account/login";
        }

        /// get the user and plan details
        const userDetailsresponse = await fetch(
          `${process.env.NEXT_PUBLIC_WEBSITE_URL}api/account/user/details?userId=${cookies?.userId}`,
          {
            method: "GET",
            next: { revalidate: 0 },
          }
        );
        const userDetails = await userDetailsresponse.json();
        userDetailContext?.handleChange("noOfChatbotsUserCreated")(
          userDetails?.noOfChatbotsUserCreated
        );

        // botContext?.handleChange("plan")(userDetails?.plan);

        // setUserDetails(userDetails);
        setChatbotData(data.chatbots);
        setLoading(false);
      } catch (error) {
        setLoading(false);
        console.error("Error fetching chatbot data:", error);
      }
    };

    fetchData();
  }, [changeFlag]);

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

  const handleUpgradePlan = () => {
    setIsPlanNotification(false);
    router.push("/home/pricing");
  };

  const createVoiceBotHandler = () => {
    // voiceBotContextData.reInitiateState();
    router.push("/voicebot");
  };

  /// view chatbot
  function openChatbot(id: any) {
    /// send the user to dashboard page
    router.push(
      `${
        process.env.NEXT_PUBLIC_WEBSITE_URL
      }chatbot/dashboard?${encodeURIComponent("chatbot")}=${encodeURIComponent(
        JSON.stringify(
          chatbotData.filter((data: any) => {
            return data.id == id;
          })[0]
        )
      )}&editChatbotSource=${isPlanNotification ? "history" : "chatbot"}`
    );
  }

  if (status === "authenticated" || cookies?.userId) {
    return (
      <div
        className="chatbot-list-container"
        onClick={() => openMenu && setOpenMenu(null)}
      >
        {/*------------------------------------------title----------------------------------------------*/}
        <div className="title-container">
          <div className="title-header-container">
            <h1
              className={!isVoiceBotActived ? "title activate-title" : "title"}
              onClick={() => voiceBotActiveDeactiveHandler(false)}
            >
              My Chatbots
            </h1>
            <h1
              className={isVoiceBotActived ? "title activate-title" : "title"}
              onClick={() => voiceBotActiveDeactiveHandler(true)}
            >
              My Voicebot
            </h1>
          </div>

          <div className="action-container">
            <div className="chatbot-list-action">
              <Icon
                className={
                  isVoiceBotActived
                    ? voiceListType === "grid"
                      ? "active"
                      : ""
                    : listType === "grid"
                      ? "active"
                      : ""
                }
                Icon={GridIcon}
                click={() => {
                  if (isVoiceBotActived) {
                    setVoiceListType("grid");
                  } else {
                    setListType("grid");
                  }
                }}
              />

              <Icon
                className={
                  isVoiceBotActived
                    ? voiceListType === "table"
                      ? "active"
                      : ""
                    : listType === "table"
                      ? "active"
                      : ""
                }
                Icon={MenuIcon}
                click={() => {
                  if (isVoiceBotActived) {
                    setVoiceListType("table");
                  } else {
                    setListType("table");
                  }
                }}
              />
            </div>
            {/* <Link href={`${process.env.NEXT_PUBLIC_WEBSITE_URL}home`}> */}
            {isVoiceBotActived ? (
              <button onClick={createVoiceBotHandler}>New Voicebot</button>
            ) : (
              <button
                onClick={() => {
                  // showModal()
                  /// check if user has exceeded the number of creation of bots
                  if (
                    userDetails?.noOfChatbotsUserCreated + 1 >
                    userDetails?.plan?.numberOfChatbot
                  ) {
                    setOpenLimitModel(true);
                    return;
                  }

                  // setOpenNewChatbotNameModal(true);
                  window.location.href =
                    "/create-first-assistant?source=chatbot";
                }}
                disabled={
                  loading || (user && new Date(user?.endDate) < new Date())
                }
              >
                New Chatbot
              </button>
            )}

            {/* </Link> */}
          </div>

          {/* {openLimitModal ? (
              <LimitReachedModal setOpenLimitModel={setOpenLimitModel} />
            ) : (
              <></>
            )} */}
        </div>

        {!isVoiceBotActived ? (
          <>
            {/*------------------------------------------chatbot-list-grid----------------------------------------------*/}
            {listType === "grid" && (
              <GridLayout
                chatbotData={chatbotData}
                changeMenu={changeMenu}
                openMenu={openMenu}
                openChatbot={openChatbot}
                setOpenShareModal={setOpenShareModal}
                chatbotId={chatbotId}
                setChatbotId={setChatbotId}
                setOpenDeleteModal={setOpenDeleteModal}
                setOpenRenameModal={setOpenRenameModal}
                // disabled={user && new Date(user?.endDate) < new Date()}
              />
            )}

            {/*------------------------------------------chatbot-list-table----------------------------------------------*/}
            {listType === "table" && (
              <TableLayout
                chatbotData={chatbotData}
                changeMenu={changeMenu}
                openMenu={openMenu}
                openChatbot={openChatbot}
                setOpenShareModal={setOpenShareModal}
                chatbotId={chatbotId}
                setChatbotId={setChatbotId}
                setOpenDeleteModal={setOpenDeleteModal}
                setOpenRenameModal={setOpenRenameModal}
                // disabled={user && new Date(user?.endDate) < new Date()}
              />
            )}
            <DeleteModal
              open={openDeleteModal}
              setOpen={setOpenDeleteModal}
              chatbotId={chatbotId}
              setChangeFlag={setChangeFlag}
              changeFlag={changeFlag}
            />
            <ShareModal
              open={openShareModal}
              setOpen={setOpenShareModal}
              chatbotId={chatbotId}
            />
            <RenameModal
              open={openRenameModal}
              setOpen={setOpenRenameModal}
              chatbotId={chatbotId}
              setChangeFlag={setChangeFlag}
              changeFlag={changeFlag}
            />

            <NewChatbotNameModal
              open={openNewChatbotNameModal}
              setOpen={setOpenNewChatbotNameModal}
              chatbotId={chatbotId}
            />

            {/*------------------------------------------loading/no-chatbots----------------------------------------------*/}
            {!loading && chatbotData?.length == 0 && (
              <div className="no-chatbots-container">
                <Image src={noChatbotBg} alt="no-chatbot-bg" />
                <p>
                  You haven&apos;t created any Chatbots. Go ahead and create a
                  New Chatbot!
                </p>
              </div>
            )}
            {loading && <Spin indicator={antIcon} />}


          </>
        ) : (
          <>
            {voiceBotLoading ? (
              <Spin indicator={antIcon} />
            ) : voiceAssistantList?.length == 0 ? (
              <div className="no-chatbots-container">
                <Image src={noChatbotBg} alt="no-chatbot-bg" />
                <p>
                  You haven&apos;t created any Voicebot. Go ahead and create a
                  New Voicebot!
                </p>
              </div>
            ) : (
              <>
              {voiceListType === "grid" && (
                <div className="voicebot-list-container">
                  {voiceAssistantList?.map((assistant: any, index: number) => (
                    <div
                      key={index}
                      className="voicebot-list-card"
                      onClick={() => selectedAssistantHandler(assistant)}
                    >
                      <div className="assistant-image">
                        <Image
                          alt="assistant image"
                          src={voiceAssistantPreview}
                        ></Image>
                      </div>
                      <div className="assistant-title">
                        {assistant.assistantName}
                      </div>
                      <div className="info-content">
                        <div className="info">
                          <div className="info-label">Number of Calls</div>
                          <div className="value">{assistant?.metadata?.totalCallLogs || 0}</div>
                        </div>
                        <div className="info">
                          <div className="info-label">Last Used</div>
                          <div className="value">{getDate(assistant?.metadata?.lastUsed) || 0}</div>
                        </div>
                        <div className="info">
                          <div className="info-label">Last Trained</div>
                          <div className="value">{getDate(assistant?.metadata?.lastTrained) || 0}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {voiceListType === "table" && (
                <VoicebotTableLayout
                  voiceAssistantList={voiceAssistantList}
                  selectedAssistantHandler={selectedAssistantHandler}
                  getDate={getDate}
                />
              )}
            </>
            )}
          </>
        )}
      </div>
    );
  } else if (status === "unauthenticated") {
    redirect("/account/login");
  }
}

export default dynamic((): any => Promise.resolve(Chatbot), { ssr: false });
