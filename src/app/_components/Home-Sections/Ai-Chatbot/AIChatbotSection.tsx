import React from "react";
import "./ai-chatbot-section.css";
import Image from "next/image";
import Sectionimg from "../../../../../public/sections-images/ai-chatbot-section/ai-chatbot-section-bg.svg";

function AIChatbotSection() {
  return (
    <>
      <div className="ai-chatbot-text">AI CHATBOT</div>
      <div className="ai-chatbot-section-container">
        {/* ------------------------------left section------------------------------- */}
        <div className="left">
          <div className="welcome-text">Wel Come to AI CHATBOT</div>
          <div className="section-text">
            At Lucifer.ai, we bring you the future of AI-driven conversations.
            Step into a world where your online interactions are powered by
            intelligent machines. We are thrilled to welcome you to a new era of
            conversational excellence. Say Hello to Lucifer.AI, your intelligent
            companion in the digital realm
          </div>
          <div className="request-demo-email-container">
            <input type="text" placeholder="Enter your email" />
            <button className="request-demo-btn">Request Demo</button>
          </div>
        </div>

        {/* ------------------------------right section------------------------------- */}
        <div className="right">
          <Image src={Sectionimg} alt="ai-chatbot-section-image" />
        </div>
      </div>
    </>
  );
}

export default AIChatbotSection;
