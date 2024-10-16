import React from "react";
import "./home-assistant.scss";
import HeaderAssistant from "@/app/_components/HeaderAssistant/HeaderAssistant";
import ChatAssistant from "../ChatAssistant/ChatAssistant";

const HomeAssistant = () => {
  return (
    <>
      <div className="home-assistant-wrapper">
        <HeaderAssistant />
        <ChatAssistant />
      </div>
    </>
  );
};

export default HomeAssistant;
