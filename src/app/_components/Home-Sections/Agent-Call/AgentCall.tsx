"use client";
import React, { useEffect, useState } from "react";
import "./agent-call.scss";
import Image from "next/image";
import jessicaImg from "../../../../../public/sections-images/header-background/jessica.png";
import davidImg from "../../../../../public/sections-images/header-background/david.png";
import micIcon from "../../../../../public/sections-images/header-background/microphone-2.svg";
import callEnd from "../../../../../public/sections-images/header-background/call-remove.svg";
import callOutgoing from "../../../../../public/sections-images/header-background/call-outgoing.svg";
// --- Vapi import and enum ---
import Vapi from "@vapi-ai/web";

enum CALLSTATUS {
  VOID,
  CONNECTING,
  LISTENING,
  SPEAKING,
  CALLSTOP
}


const vapi = new Vapi(process.env.NEXT_PUBLIC_VAP_API as string); // Vapi public key


function AgentCall() {
  const [agent, setAgent] = useState<string | null>(null);
  const [isCallEnded, setCallEnded] = useState<Boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [callStatus, setCallStatus] = useState<string>("");
  const [enableMuteButton, setMuteButton] = useState<boolean>(false);

  // --- Calling state ---
  const [isListening, setIsListening] = useState<CALLSTATUS>(CALLSTATUS.VOID);
  const [realTimeSpeach, setRealTimeSpeach] = useState<{ role: string; message: string }>({
    role: "",
    message: ""
  });

  // --- Setup agent from URL ---
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const agentParam: any = searchParams.get("agent");
    setAgent(agentParam);
  }, []);

  // --- Call control handlers ---
  const startCall = () => {
    setRealTimeSpeach({ role: "", message: "" });

    vapi.start(agent === "jessica" ? "7405ae23-f6a2-4e84-8146-6b401170dff2" : "defa6b42-9805-4c79-a379-d647b0a59854" );//defa6b42-9805-4c79-a379-d647b0a59854
    setIsListening(CALLSTATUS.CONNECTING);
    setCallEnded(false);
    setCallStatus("Calling To");

  };

  const stopCall = () => {
    setRealTimeSpeach({ role: "", message: "" });

    vapi.stop();
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
  };

  // --- Vapi event listeners (no .off, just as in your provided code) ---

  vapi.on("message", (message: any) => {
    if (message["type"] === "transcript") {
      setRealTimeSpeach({ role: message["role"], message: message.transcript });
    }
  });

  vapi.on("error", (e) => {
    vapi.stop();
    setRealTimeSpeach({ role: "", message: "" });
    setIsListening(CALLSTATUS.CALLSTOP);
    setCallEnded(true);
    setMuteButton(false);
    setIsMuted(false);
    setCallStatus("");
  });

  vapi.on("call-end", () => {
    console.log("on call end");
    vapi.stop();
    setRealTimeSpeach({ role: "", message: "" });
    setIsListening(CALLSTATUS.CALLSTOP);
    setCallEnded(true);
    setMuteButton(false);
    setIsMuted(false);
    setCallStatus("");
  });

  // vapi.on("speech-start", () => {
  //   setIsListening(CALLSTATUS.SPEAKING);
  // });

  // vapi.on("speech-end", () => {
  //   console.log("on call end speech end")
  //   if (isCallEnded) {
  //     setIsListening(CALLSTATUS.LISTENING);
  //   }
  // });

  vapi.on("call-start", () => {
    setIsListening(CALLSTATUS.CONNECTING);
    setMuteButton(true);
    setCallStatus("Connected With")
  });


  return (
    <>
      <div className="agent-call-wrapper">
        <div className="agent-details">
          <div className="agent-text-header">
            <h2>{agent === "jessica" ? callStatus +" Jessica" : callStatus +" David"}</h2>
            <p>Torri&apos;s Customer Service Agent</p>
            
          </div>
       

          <div className="avatar-container">
            <Image
              src={agent === "jessica" ? jessicaImg : davidImg}
              alt={`Agent ${agent === "jessica" ? "Jessica" : "David"}`}
              width={140}
              height={140}
              className="avatar"
            />
          </div>

          <div className="controls">
            
            {enableMuteButton &&  <button
              className="icon-btn mic"
              onClick={muteCallHandler}
            >
              <Image src={micIcon} className={`${isMuted ? 'img-red':''}`} alt="Mic" width={24} height={24} />
            </button>
            }
            <button
              className={`icon-btn end-call`}
              onClick={
                isListening === CALLSTATUS.VOID || isListening === CALLSTATUS.CALLSTOP
                  ? startCall
                  : stopCall
              }
            >
              <Image
                src={
                  isListening === CALLSTATUS.VOID || isListening === CALLSTATUS.CALLSTOP
                    ? callOutgoing
                    : callEnd
                }
                alt={
                  isListening === CALLSTATUS.VOID || isListening === CALLSTATUS.CALLSTOP
                    ? "Start Call"
                    : "End Call"
                }
                className={`${isCallEnded ? 'img-green' : 'img-red'}`}
                width={24}
                height={24}
              />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default AgentCall;
