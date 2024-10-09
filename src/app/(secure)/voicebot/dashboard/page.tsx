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

import { CreateVoiceBotContext } from "../../../_helpers/client/Context/VoiceBotContextApi"

function Dashboard() {
  const router = useRouter();
    /// fetch the params
  const params: any = useSearchParams();

  let [tab, setTab] = useState<string>("model");

  const editChatbotSource = params.get("voicBotName") ?? "VoiceBot";

  const voiceBotContextData: any = useContext(CreateVoiceBotContext);
  const voicebotDetails = voiceBotContextData.state;

  let tabValue = "model";

  useEffect(() => {
    debugger;
    if (!voiceBotContextData?.assistantInfo) {
      router.push("/chatbot");
    }

    if(voiceBotContextData.assistantInfo?.assistantVapiId) {

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

  const vapiAssistantPublishHandler = async () => {
    // publish the assistant to the vapi

    //validate the assistant require field first,

    //call the post api to publish the assistant to the vapi

    debugger;
    if(~voiceBotContextData?.isPublishEnabled){
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
            <Button className="demo-call-button">
              <div className="button-content">
                <Image alt="phone-call" src={callOutgoing}></Image>
                <span className="button-text">Demo Talk</span>
              </div>
            </Button>
            <Button className={~voiceBotContextData?.isPublishEnabled ? "publish-button" : "publish-button publish-button-disabled" } onClick={vapiAssistantPublishHandler}>Publish</Button>
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