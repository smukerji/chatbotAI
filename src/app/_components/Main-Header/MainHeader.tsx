"use client";

import React from "react";
import "./mainheader.css";
import { Button, Input, Space } from "antd";

function MainHeader() {
  return (
    <div className="main-header">
      <p className="header-text">Welcome to AI Chatbot</p>

      <p className="header-sub-text">
        At Lucifer.ai, we bring you the future of AI-driven conversations. Step
        into a world where your online interactions are powered by intelligent
        machines. We are thrilled to welcome you to a new era of conversational
        excellence. Say Hello to Lucifer.AI, your intelligent companion in the
        digital realm
      </p>

      <div className="request-demo">
        <input type="text" placeholder="Email Address" name="" id="" className="email-input"/>
        <Button type="primary">Request Demo</Button>
      </div>

      <Space.Compact>
        <Input defaultValue="Email Address" />
        <Button type="primary">Submit</Button>
      </Space.Compact>
    </div>
  );
}

export default MainHeader;
