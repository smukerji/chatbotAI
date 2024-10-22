"use client";
import {
  Button,
  Dropdown,
  MenuProps,
  message,
  Modal,
  Radio,
  RadioChangeEvent,
} from "antd";
import Model from "../dashboard/model/Model";
import React, { useContext, useEffect, useState,useRef } from "react";
import dynamic from "next/dynamic";
import "./dashboard.scss";
import { useRouter, useSearchParams} from "next/navigation";


import leftArrow from "../../../../../public/voiceBot/SVG/arrow-left.svg"
import callOutgoing from "../../../../../public/voiceBot/SVG/call-outgoing.svg"
import moreCircle from "../../../../../public/voiceBot/more-circle.svg"

import documentCopy from "../../../../../public/voiceBot/document-copy.svg"

import documentTrash from "../../../../../public/voiceBot/documents-trash.svg"


import arrowIcon from "../../../../../public/svgs/Feather Icon.svg";
import Image from "next/image";
import Transcriber from "./transcriber/Transcriber";
import Voice from "./voice/Voice";
import Functions from "./functions/Functions";
import Advance from "./advance/Advance";
import Analysis from "./analysis/Analysis";
import PhoneNumber from "./phone-number/PhoneNumber";
import CallLogs from "./call-logs/CallLogs";
import Vapi from '@vapi-ai/web';

import { CreateVoiceBotContext } from "../../../_helpers/client/Context/VoiceBotContextApi";

const vapi = new Vapi(process.env.NEXT_PUBLIC_VAP_API as string); // Vapi public key

enum CALLSTATUS {
  VOID,
  CONNECTING,
  LISTENING,
  SPEAKING,
  CALLSTOP
}

function Dashboard() {
  const router = useRouter();
    /// fetch the params
  const params: any = useSearchParams();

  let [tab, setTab] = useState<string>("model");

  const editChatbotSource = params.get("voicBotName") ?? "VoiceBot";

  const [isListening, setIsListening] = useState(CALLSTATUS.VOID);
  const [isMuted, setIsMuted] = useState(false);
  
  const [isMoreContentVisible, setIsMoreContentVisible] = useState(false);

  const [showMakeCallButton, setShowMakeCallButton] = useState(true);

  const voiceBotContextData: any = useContext(CreateVoiceBotContext);
  const voicebotDetails = voiceBotContextData.state;

  const divRef = useRef<HTMLDivElement>(null);


  let tabValue = "model";

  useEffect(() => {

    if (!voiceBotContextData?.assistantInfo) {
      router.push("/chatbot");
    }

    debugger;
    if(voiceBotContextData.assistantInfo?.vapiAssistantId) {

      getAssistantData(voiceBotContextData.assistantInfo?.vapiAssistantId);

    }
    else{
      //  the system prompt based on the mongo record

    }
    if(voiceBotContextData?.assistantInfo?.assistantName){
      voiceBotContextData.updateState("name",voiceBotContextData?.assistantInfo?.assistantName);
    }
  }, []);

  const getAssistantData = async (vapiAssiId:string)=>{

        //get the assistant record from the vapi's side
        try{

          const assistantDataResponse = await fetch(
            `${process.env.NEXT_PUBLIC_WEBSITE_URL}voicebot/dashboard/api/vapi/assistant/?assistantId=${vapiAssiId}`,
            {
              method: "GET",
            }
          );

          const assistantDataResponseParse = await assistantDataResponse.json();
          debugger;
          if(assistantDataResponseParse?.error){
            message.error("Error while getting the assistant data");
            return;
          }
          debugger;

          if(assistantDataResponseParse?.result){

            const vapiAssistanceData = assistantDataResponseParse?.result;

            debugger;
            let assistantData:any = voiceBotContextData.state ;
            assistantData.firstMessage = vapiAssistanceData.firstMessage;
            assistantData.transcriber = vapiAssistanceData.transcriber;
            assistantData.model = vapiAssistanceData.model;
            assistantData.voice = vapiAssistanceData.voice;
            //piping the voice data
            let punctuationBoundaries = assistantData.voice.chunkPlan.punctuationBoundaries; 
            // ["。","，"]
            const punctuationBoundaryPredefineValues = [
              { value: "0", label: "。" },
              { value: "1", label: "，" },
              { value: "2", label: "." },
              { value: "3", label: "!" },
              { value: "4", label: "?" },
              { value: "5", label: ";" },
              { value: "6", label: "،" },
              { value: "7", label: "۔" },
              { value: "8", label: "।" },
              { value: "9", label: "॥" },
              { value: "10", label: "|" },
              { value: "11", label: "||" },
              { value: "12", label: "," },
              { value: "13", label: ":" }
            ];

            let punctuationBoundariesArray = punctuationBoundaryPredefineValues.filter(item => 
              punctuationBoundaries.includes(item.label)
            );

            assistantData.voice.chunkPlan.punctuationBoundaries = punctuationBoundariesArray;
            assistantData.firstMessageMode = vapiAssistanceData.firstMessageMode;
            assistantData.llmRequestDelaySeconds = vapiAssistanceData.llmRequestDelaySeconds;
            assistantData.responseDelaySeconds = vapiAssistanceData.responseDelaySeconds;
            assistantData.hipaaEnabled = vapiAssistanceData.hipaaEnabled;
            assistantData.silenceTimeoutSeconds = vapiAssistanceData.silenceTimeoutSeconds;
            assistantData.maxDurationSeconds = vapiAssistanceData.maxDurationSeconds;
            assistantData.backgroundSound = vapiAssistanceData.backgroundSound;
            assistantData.backchannelingEnabled = vapiAssistanceData.backchannelingEnabled;
            assistantData.backgroundDenoisingEnabled = vapiAssistanceData.backgroundDenoisingEnabled;
            assistantData.modelOutputInMessagesEnabled = vapiAssistanceData.modelOutputInMessagesEnabled;
            assistantData.name = vapiAssistanceData.name;
            assistantData.numWordsToInterruptAssistant = vapiAssistanceData.numWordsToInterruptAssistant;
            assistantData.voicemailDetection = vapiAssistanceData.voicemailDetection;
            assistantData.voicemailMessage = vapiAssistanceData.voicemailMessage;
            assistantData.endCallMessage = vapiAssistanceData.endCallMessage;
            // endCallPhrases= [""],
            assistantData.metadata = vapiAssistanceData.metadata;


            let analysysPlanPickData = vapiAssistanceData.analysisPlan;

            if(analysysPlanPickData?.structuredDataSchema && analysysPlanPickData?.structuredDataSchema?.properties){
              let propertiesData = analysysPlanPickData?.structuredDataSchema?.properties;
              if(Object.keys(propertiesData).length > 0){

                const propertyArrayData = Object.entries(propertiesData).map(([name, value]: [string, any],index:number) => ({
                  id: index,
                  name,
                  type: value.type,
                  description: value.description,
                  saved:true
                }));
                // assistantData.analysisPlan = vapiAssistanceData.analysisPlan;
                assistantData.analysisPlan.structuredDataSchema.properties = propertyArrayData;
              }
              else{
                assistantData.analysisPlan.structuredDataRequestTimeoutSeconds = vapiAssistanceData.analysisPlan.tructuredDataRequestTimeoutSeconds;
                assistantData.analysisPlan.successEvaluationRequestTimeoutSeconds = vapiAssistanceData.analysisPlan.successEvaluationRequestTimeoutSeconds;
                assistantData.analysisPlan.successEvaluationRubric = vapiAssistanceData.analysisPlan.successEvaluationRubric;
                assistantData.analysisPlan.summaryRequestTimeoutSeconds = vapiAssistanceData.analysisPlan.summaryRequestTimeoutSeconds;

              }
            }
            else{
              assistantData.analysisPlan.structuredDataRequestTimeoutSeconds = vapiAssistanceData.analysisPlan.tructuredDataRequestTimeoutSeconds;
              assistantData.analysisPlan.successEvaluationRequestTimeoutSeconds = vapiAssistanceData.analysisPlan.successEvaluationRequestTimeoutSeconds;
              assistantData.analysisPlan.successEvaluationRubric = vapiAssistanceData.analysisPlan.successEvaluationRubric;
              assistantData.analysisPlan.summaryRequestTimeoutSeconds = vapiAssistanceData.analysisPlan.summaryRequestTimeoutSeconds;

            }

            if(vapiAssistanceData?.messagePlan && vapiAssistanceData?.messagePlan?.idleMessages){
              let messagePlanPickData = vapiAssistanceData.messagePlan.idleMessages;
              
              const idleMessageList = [
                { value: "1", label: "Are you still there?" },
                { value: "2", label: "Is there anything else you need help with?" },
                { value: "3", label: "Feel free to ask me any questions." },
                { value: "4", label: "How can I assist you further?" },
                { value: "5", label: "Let me know if there's anything you need." },
                { value: "6", label: "I'm still here if you need assistance." },
                { value: "7", label: "I'm ready to help whenever you are." },
                { value: "8", label: "Is there something specific you're looking for?" },
                { value: "9", label: "I'm here to help with any questions you have." }
              ];
              
              if(messagePlanPickData.length > 0){
                const idleMessageArray = idleMessageList.filter(item => 
                  messagePlanPickData.includes(item.label)
                );
                assistantData.analysisPlan.messagePlan.idleMessages = idleMessageArray;
              }
              
            }

            //update the context data
            voiceBotContextData.setState(assistantData);
            message.success("Assistant Fetch Successfully");

          }

        }
        catch(error:any){
          debugger;
          console.log("error", error);
          message.error("Error while getting the assistant data");
        }
  
  }

  useEffect(() => {
    console.log("isPublishEnabled", voiceBotContextData?.isPublishEnabled);
    debugger;
  }, [voiceBotContextData?.isPublishEnabled]);

  const makeVapiAssistantCall = async () => {
    let isIdAvaliable = voiceBotContextData.assistantInfo["vapiAssistantId"];
    debugger;
    if(isIdAvaliable){
      //if vapi assistant id is present then make the call to the vapi
      vapi.start(isIdAvaliable); // assistance ID
      // debugger;
      setIsListening(CALLSTATUS.CONNECTING);
    }
    else{
      message.error("Assistant is not published yet");
    }
    
  }

  vapi.on("call-start", () => {
    // debugger;
    setIsListening(CALLSTATUS.CONNECTING);
    setShowMakeCallButton(false);
    console.log("Call has started.");
  });

  vapi.on("call-end", () => {

    vapi.stop();
    setIsMuted(false);
    setShowMakeCallButton(true);
    console.log("Call has ended.");
    setIsListening(CALLSTATUS.CALLSTOP);

  });

  vapi.on("speech-start", () => {
    // debugger;
    setIsListening(CALLSTATUS.SPEAKING);
    setShowMakeCallButton(false);
    // lottieRefs.current.play();
    console.log("Assistant speech has started.");
  });

  vapi.on("error", (e) => {
    // debugger;
    // lottieRefs.current.pause();
    console.error(e);
    setShowMakeCallButton(true);
    setIsMuted(false);
    vapi.stop();
    setIsListening(CALLSTATUS.CALLSTOP);
  });

  const stopCallHandler = () => {

    vapi.stop();
    setShowMakeCallButton(true);
    setIsMuted(false);
    setIsListening(CALLSTATUS.CALLSTOP);
  };

  const muteCallHandler = () => {
    if(isMuted){ // if the call is muted then unmute the call
      vapi.setMuted(false);
      setIsMuted(false);
    }
    else{ // if the call is unmute then mute the call
      vapi.setMuted(true);
      setIsMuted(true);
    }
  }

  const showAdditionalContentItemHandler = () => {

    //prevent the div to disappear instantly
    setTimeout(() => {
      setIsMoreContentVisible(!isMoreContentVisible);
    }, 0);

  }



  const vapiAssistantPublishHandler = async () => {
    // publish the assistant to the vapi

    //validate the assistant require field first,

    //call the post api to publish the assistant to the vapi

    debugger;
    if(!voiceBotContextData?.isPublishEnabled){
      message.error("Please fill the required fields to publish the assistant");
      return;
    }
    
    try{

      debugger;
      const assistantCreateResponse = await fetch(
        `${process.env.NEXT_PUBLIC_WEBSITE_URL}voicebot/dashboard/api/vapi/assistant`,
        {
          method: "POST",
          body: JSON.stringify({
            assistantVapiData: voicebotDetails,
            assistantLocalData:voiceBotContextData.assistantInfo
          })
        }
      );

      const assistantCreateResponseParse = await assistantCreateResponse.json();
      debugger;
      if(assistantCreateResponseParse?.error){
        message.error("Error while publishing the assistant");
        return;
      }
      if(assistantCreateResponseParse?.assistantVapiId){
        voiceBotContextData.setAssistantInfo({
          ...voiceBotContextData.assistantInfo,
          vapiAssistantId:assistantCreateResponseParse.assistantVapiId
        });
        message.success("Assistant published successfully");
        voiceBotContextData.setIsPublishEnabled(false);
      }

    }
    catch(error:any){
      console.log("error", error);
      message.error("Error while publishing the assistant");
    }
   
  }

  const changeHandler = (value: string) => {
    console.log("working , clicking")
    setTab(value);
  }

  const tatabyebyeHandler = () => {
    setIsMoreContentVisible(false);
  }

  
  const handleDocumentClick = (event: MouseEvent) => {
    // debugger;
    if (divRef.current && !divRef.current.contains(event.target as Node)) {
      setIsMoreContentVisible(false);
    }
  };


  useEffect(() => {
    document.addEventListener('click', handleDocumentClick);
    return () => {
      document.removeEventListener('click', handleDocumentClick);
    };
  }, []);

  return (
  
    <div className="voice-bot-container">
      <div className="top">
        <div className="headers">
          <div className="header-title">
            <Image className="image" alt="back_arrow" src={leftArrow} onClick={()=>{
              router.push("/chatbot")
            }}></Image>
            <h1 className="title">{voicebotDetails.name || voiceBotContextData?.assistantInfo?.assistantName || editChatbotSource}</h1>

          </div>
          <div className="header-description">
            <h4 className="description">Add your data sources to train your Voice agent</h4>
          </div>
        </div>
        <div className="middle-container">
          <div className="list-container">
            <ul className="tool-list">
              <li className={tab == "model" ? "active" : ""} onClick={()=> changeHandler("model")}>Model</li>
              <li className={tab == "transcriber" ? "active" : ""} onClick={() => changeHandler("transcriber")}>Transcriber</li>
              <li className={tab == "voice" ? "active" : ""} onClick={() => changeHandler("voice")}>Voice</li>
              {/* <li className={tab == "tool" ? "active" : ""} onClick={() => changeHandler("tool")}>Tool</li> */}
              <li className={tab == "advance" ? "active" : ""} onClick={() => changeHandler("advance")}>Advance</li>
              <li className={tab == "analysis" ? "active" : ""} onClick={() => changeHandler("analysis")}>Analysis</li>
              {/* <li className={tab == "phone-number" ? "active" : ""} onClick={() => changeHandler("phone-number")}>Phone Number</li> */}
              <li className={tab == "call-logs" ? "active" : ""} onClick={() => changeHandler("call-logs")}>Call Logs</li>

            </ul>
            <hr style={{ width: "830px" }} />
          </div>
          <div className="button-container">
            <Button className="circle-button" onClick={showAdditionalContentItemHandler}>
              <div className="cirle-button-inner-wrapper">
              <Image width={24} height={24} alt="arrow" src={moreCircle}></Image>
              </div>
            </Button>
            
           { isMoreContentVisible && (<div ref={divRef} className="content-holder"  onClick={(e) => e.stopPropagation()} >
              <Button className="duplicate-assistant-button">
                <div className="duplicate-assistant-button-content">
                  <Image alt="" src={documentCopy} className="duplicate-assistant-button-icon"></Image>
                  <span className="duplicate-assistant-button-text">Duplicate</span>
                </div>
              </Button>
              <Button className="delete-assistant-button">
                <div className="delete-assistant-button-content">
                  <Image alt="" src={documentTrash} className="delete-assistant-button-icon"></Image>
                  <span className="delete-assistant-button-text">Delete</span>
                </div>
              </Button>
            </div>)
            }
            {
              showMakeCallButton ?

                <Button className="demo-call-button" onClick={makeVapiAssistantCall}>
                  <div className="button-content">
                    <Image alt="phone-call" src={callOutgoing}></Image>
                    <span className="button-text">
                      {

                        isListening == CALLSTATUS.VOID ? "Demo Talk!" :
                          isListening == CALLSTATUS.CONNECTING ? "Calling..." :
                            isListening == CALLSTATUS.SPEAKING ? "speaking..." :
                              isListening == CALLSTATUS.LISTENING ? "listening..." :
                                isListening == CALLSTATUS.CALLSTOP ? "Call Again" : "Demo Talk!"
                      }

                    </span>
                  </div>
                </Button>
                :
                <div className="after-call-container">
                  <Button className="button-content" onClick={muteCallHandler}>
                      <span className="button-text">
                        {isMuted ? "Unmute call" : "Mute call"}
                      </span>
                    
                  </Button>

                  <Button className="button-content" onClick={stopCallHandler}>
                   
                      <span className="button-text">
                        End Call
                      </span>
                  
                  </Button>
                </div>
            }
            <Button className={!voiceBotContextData?.isPublishEnabled ? "publish-button publish-button-disabled" : "publish-button" } onClick={vapiAssistantPublishHandler}>Publish</Button>
          </div>
          
        </div>
      </div>
      <div className="bottom">
        

        {
          tab == "model" && (
            <>
              <Model />
            </>
          )
        }

        {
          tab == "transcriber" && (
            <>
              <Transcriber />
            </>
          )
        }

        {
          tab == "voice" && (
            <>
              <Voice/>
            </>
          )
        }

        {
          tab == "tool" && (
            <>
              <Functions/>
            </>
          )
        }

        {
          tab == "advance" && (
            <>
              <Advance />
            </>
          )
        }

        {
          tab == "analysis" && (
            <>
              <Analysis />
            </>
          )
        }

        {
          tab == "phone-number" && (
            <>
              <PhoneNumber />
            </>
          )
        }

        {
          tab == "call-logs" && (
            <>
              <CallLogs />
            </>
          )
        }

      </div>

      {/* <div className={isMoreContentVisible ? "additional-circle-items-behinds" : "additional-circle-items-behinds-hide"} onClick={tatabyebyeHandler}>
              
        </div> */}

    


    </div>


   
    

    )
}

export default dynamic((): any => Promise.resolve(Dashboard), { ssr: false });