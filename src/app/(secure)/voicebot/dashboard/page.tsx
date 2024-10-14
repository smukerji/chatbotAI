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
import React, { useContext, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import "./dashboard.scss";
import { useRouter, useSearchParams} from "next/navigation";


import leftArrow from "../../../../../public/voiceBot/SVG/arrow-left.svg"
import callOutgoing from "../../../../../public/voiceBot/SVG/call-outgoing.svg"

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

  const [showMakeCallButton, setShowMakeCallButton] = useState(true);

  const voiceBotContextData: any = useContext(CreateVoiceBotContext);
  const voicebotDetails = voiceBotContextData.state;


  let tabValue = "model";

  useEffect(() => {
    let data = voiceBotContextData?.assistantInfo;
    console.log(data);
    debugger;
    if (!voiceBotContextData?.assistantInfo) {
      router.push("/chatbot");
    }

    if(voiceBotContextData.assistantInfo?.vapiAssistantId) {

      //get the assistant record from the vapi's side


    }
    else{
      //  the system prompt based on the mongo record

    }
    debugger;
    if(voiceBotContextData?.assistantInfo?.assistantName){
      voiceBotContextData.updateState("name",voiceBotContextData?.assistantInfo?.assistantName);
    }
  }, []);

  useEffect(() => {
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
            <hr />
          </div>
          <div className="button-container">
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


    </div>


   
    

    )
}

export default dynamic((): any => Promise.resolve(Dashboard), { ssr: false });