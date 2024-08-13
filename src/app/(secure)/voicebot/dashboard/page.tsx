"use client";
import {
  Button,
  Dropdown,
  MenuProps,
  Modal,
  Radio,
  RadioChangeEvent,
} from "antd";
import React, { useContext, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import "./dashboard.scss";

import arrowIcon from "../../../../../public/svgs/Feather Icon.svg";
import Image from "next/image";
function Dashboard() {

  /// get the bot context
  // const botContext: any = useContext(CreateBotContext);
  // const botDetails = botContext?.createBotInfo;

  /// get the bot setting context
  // const chatbotSettingContext: any = useContext(ChatbotSettingContext);
  // const chatbotSettings = chatbotSettingContext?.chatbotSettings;

  /// check which action is active
  // const editChatbot = botDetails?.editChatbot;


    return (
      <div className="edit-chatbot-container">
        {/*------------------------------------------top-section----------------------------------------------*/}
        <div className="top">
          {/*------------------------------------------header----------------------------------------------*/}
          <div className="sources-header">
            <div className="title">
              <Image
                src={arrowIcon}
                alt="arrow-icon"
                style={{ transform: "rotate(180deg)", cursor: "pointer" }}
                onClick={() => {
                  // botContext?.resetCreateBotInfo();
                  // chatbotSettingContext?.resetChatbotSettings();
                  // window.history.back();
                }}
              />
              {/* <h1>{chatbot?.name}</h1> */}
              <h1>ChatBot Name</h1>
              
            </div>

            <h4>Add your data sources to train your Voice agent</h4>
            
                <ul className="options-container">
                  <li
                    className={"chatbot"}
                    value={"chatbot"}
                    // onClick={() =>
                    //   botContext?.handleChange("editChatbot")("chatbot")
                    // }
                  >
                    <h3 className="option">chatbot</h3>
                  </li>
                  <li
                    className={"settings"}
                    value={"settings"}
                    // onClick={() =>
                    //   botContext?.handleChange("editChatbot")("settings")
                    // }
                  >
                    <h3 className="option">settings</h3>
                  </li>
                  <li
                    className={"sources"}
                    value={"sources"}
                    // onClick={() => {
                    //   // fetchData();
                    //   botContext?.handleChange("editChatbot")("sources");
                    // }}
                  >
                    <h3 className="option">data sources</h3>
                  </li>
                  <li
                    className={"integrations"}
                    value={"integrations"}
                    // onClick={() =>
                    //   botContext?.handleChange("editChatbot")("integrations")
                    // }
                  >
                    <h3 className="option">Integrations</h3>
                  </li>
                  <li
                    className={"embedSite" }
                    value={"embedSite"}
                    // onClick={() =>
                    //   botContext?.handleChange("editChatbot")("embedSite")
                    // }
                  >
                    <h3 className="option">Embed on site</h3>
                  </li>

                  <li
                    className={"history"}
                    value={"history"}
                    // onClick={() =>
                    //   botContext?.handleChange("editChatbot")("history")
                    // }
                  >
                    <h3 className="option">Conversation History</h3>
                  </li>

                  <li
                    className={"leads"}
                    value={"leads"}
                    // onClick={() =>
                    //   botContext?.handleChange("editChatbot")("leads")
                    // }
                  >
                    <h3 className="option">Leads</h3>
                  </li>
                </ul>
                <hr />
          
          </div>
        </div>

       
      </div>
    )
}

export default dynamic((): any => Promise.resolve(Dashboard), { ssr: false });