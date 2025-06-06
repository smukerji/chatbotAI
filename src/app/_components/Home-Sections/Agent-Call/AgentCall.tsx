"use client";
import React, { useEffect, useState } from "react";
import "./agent-call.scss";
import Image from "next/image";
import jessicaImg from "../../../../../public/sections-images/header-background/jessica.png";
import davidImg from "../../../../../public/sections-images/header-background/david.png";
import micIcon from "../../../../../public/sections-images/header-background/microphone-2.svg";
import callIcon from "../../../../../public/sections-images/header-background/call-remove.svg";

function AgentCall() {
  const [agent, setAgent] = useState(null);

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const agentParam: any = searchParams.get("agent");
    console.log("agent", agentParam);
    setAgent(agentParam);
  }, []);
  return (
    <>
      <div className="agent-call-wrapper">
        <div className="agent-details">
          <h2>{agent === "jessica" ? "Jessica" : "David"}</h2>
          <p>Torri&apos;s Customer Service Agent</p>

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
            <button className="icon-btn mic">
              <Image src={micIcon} alt="Mic" width={24} height={24} />
            </button>
            <button className="icon-btn end-call">
              <Image src={callIcon} alt="End Call" width={24} height={24} />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default AgentCall;
