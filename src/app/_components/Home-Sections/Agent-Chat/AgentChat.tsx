"use client";
import React, { useEffect, useState } from "react";
import Image from "next/image";
import jessicaImg from "../../../../../public/sections-images/header-background/jessica.png";
import davidImg from "../../../../../public/sections-images/header-background/david.png";
import jacobImg from "../../../../../public/sections-images/digital-worker/1.png";
import alinaImg from "../../../../../public/sections-images/digital-worker/2.png";
import zaraImg from "../../../../../public/sections-images/digital-worker/3.png";
import "./agent-chat.scss";
import HeroSectionChatPopup from "../../HeroSectionChatPopup/HeroSectionChatPopup";
import { useRouter } from "next/navigation";

function AgentChat() {
  const router = useRouter();

  const [agent, setAgent] = useState(null);
  const [assistantId, setAssistantId] = useState(null);

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const agentParam: any = searchParams.get("agent");
    const assistantId: any = searchParams.get("assistantId");
    console.log("agent", agentParam, "assistantId", assistantId);
    setAgent(agentParam);
    setAssistantId(assistantId);
  }, []);

  return (
    <div className="agent-chat-wrapper">
      <div className="chat-container-section">
        {/* Left Agent Info */}
        <div className="agent-info">
          <button className="close-btn" onClick={() => router.push("/")}>
            ✕
          </button>
          <div className="agent-profile">
            <Image
              src={
                agent === "jessica"
                  ? jessicaImg
                  : agent === "david"
                  ? davidImg
                  : agent === "jacob"
                  ? jacobImg
                  : agent === "alina"
                  ? alinaImg
                  : zaraImg
              }
              alt="Agent"
              width={80}
              height={80}
              className="avatar"
            />
            <h3>
              {agent === "jessica"
                ? "Jessica"
                : agent === "david"
                ? "David"
                : agent === "jacob"
                ? "Jacob"
                : agent === "alina"
                ? "Alina"
                : "Zara"}
            </h3>
            <p>Torri&apos;s Customer Service Agent</p>
          </div>
        </div>

        {/* Right Chat Section */}
        <div className="chat-window">
          <HeroSectionChatPopup agent={agent} torriAssistantId={assistantId} />
        </div>
      </div>
    </div>
  );
}

export default AgentChat;
