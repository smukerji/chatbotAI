import React, { useState } from 'react';
import { message } from "antd";
import Image from "next/image";
import Vapi from '@vapi-ai/web';
import CallIcon from "../../../../../public/voiceBot/SVG/call-outgoing.svg";
import "./style.scss";
const vapi = new Vapi(process.env.NEXT_PUBLIC_VAP_API as string);

enum CALLSTATUS {
  VOID,
  CONNECTING,
  LISTENING,
  SPEAKING,
  CALLSTOP
}

const VapiAssistantCall = () => {
  const [isListening, setIsListening] = useState(CALLSTATUS.VOID);
  const [isMuted, setIsMuted] = useState(false);
  const [showMakeCallButton, setShowMakeCallButton] = useState(true);


    const makeVapiAssistantCall = async () => {
        debugger;
        message.success("Call has started.");
        vapi.start("19ea8142-7910-4bc7-8521-e0caebaf62a6"); // assistance ID
        setIsListening(CALLSTATUS.CONNECTING);
    }

  vapi.on("call-start", () => {
    setIsListening(CALLSTATUS.CONNECTING);
    setShowMakeCallButton(false);
    console.log("Call has started.");
   
  });

  vapi.on("call-end", async () => {
    vapi.stop();

    setIsMuted(false);
    setShowMakeCallButton(true);
    console.log("Call has ended.");
    setIsListening(CALLSTATUS.CALLSTOP);
  });

  vapi.on("speech-start", () => {
    setIsListening(CALLSTATUS.SPEAKING);
    setShowMakeCallButton(false);
    console.log("Assistant speech has started.");
  });

  vapi.on("error", (e) => {
    console.error(e);
    setShowMakeCallButton(true);
    setIsMuted(false);
    vapi.stop();
    setIsListening(CALLSTATUS.CALLSTOP);
    message.error("Error in call");
  });

  const stopCallHandler = async () => {
    vapi.stop();
    setShowMakeCallButton(true);
    setIsMuted(false);
    setIsListening(CALLSTATUS.CALLSTOP);
    message.success("Call has ended.");
  };

  const muteCallHandler = () => {
    debugger;
    if (isMuted) {
      vapi.setMuted(false);
      setIsMuted(false);
      message.success("Unmuted");
    } else {
      vapi.setMuted(true);
      setIsMuted(true);
      message.success("Muted");
    }
  };

  return (
    <div>
      {showMakeCallButton ? (
        <button className="callButton" onClick={makeVapiAssistantCall}>
          <Image src={CallIcon} alt="Call" />
          Call
        </button>
      ) : (
        <div className="callButtonContainer">
          <button className="muteButton" onClick={muteCallHandler}>
            {isMuted ? "Unmute" : "Mute"}
          </button>
          <button className="endCallButton" onClick={stopCallHandler}>
            End Call
          </button>
        </div>
      )}
    </div>
  );
};

export default VapiAssistantCall;