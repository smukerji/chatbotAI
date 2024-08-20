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


import leftArrow from "../../../../../public/voiceBot/SVG/arrow-left.svg"
import callOutgoing from "../../../../../public/voiceBot/SVG/call-outgoing.svg"

import arrowIcon from "../../../../../public/svgs/Feather Icon.svg";
import Image from "next/image";
function Dashboard() {



  return (
      
    <div className="voice-bot-container">
      <div className="top">
        <div className="headers">
          <div className="header-title">
            <Image className="image" alt="back_arrow" src={leftArrow}></Image>
            <h1 className="title">ChatBot Name</h1>
          
          </div>
          <div className="header-description">
            <h4 className="description">Add your data sources to train your Voice agent</h4>
          </div>
        </div>
        <div className="middle-container">
          <div className="list-container">
            <ul className="tool-list">
              <li>Model</li>
              <li>Transcriber</li>
              <li>Voice</li>
              <li>Tool</li>
              <li>Advance</li>
              <li>Analysis</li>

            </ul>
          </div>
          <div className="button-container">
            <Button className="demo-call-button">
              <div className="button-content">
                <Image alt="phone-call" src={callOutgoing}></Image>
                <span className="button-text">Demo Talk</span>
              </div>
            </Button>
            <Button className="publish-button">Publish</Button>
          </div>
        </div>
      </div>
    </div>

      // <div className="edit-chatbot-container">
      //   <div className="top">
      //     <div className="sources-header">
      //       <div className="title">
      //         <Image
      //           src={arrowIcon}
      //           alt="arrow-icon"
      //           style={{ transform: "rotate(180deg)", cursor: "pointer" }}
      //           onClick={() => {
                  
      //           }}
      //         />
      //         <h1>ChatBot Name</h1>
              
      //       </div>

      //       <h4>Add your data sources to train your Voice agent</h4>
            
      //           <ul className="options-container">
      //             <li
      //               className={"chatbot"}
      //               value={"chatbot"}
                    
      //             >
      //               <h3 className="option">chatbot</h3>
      //             </li>
      //             <li
      //               className={"settings"}
      //               value={"settings"}
                   
      //             >
      //               <h3 className="option">settings</h3>
      //             </li>
      //             <li
      //               className={"sources"}
      //               value={"sources"}
                    
      //             >
      //               <h3 className="option">data sources</h3>
      //             </li>
      //             <li
      //               className={"integrations"}
      //               value={"integrations"}
                    
      //             >
      //               <h3 className="option">Integrations</h3>
      //             </li>
      //             <li
      //               className={"embedSite" }
      //               value={"embedSite"}
                   
      //             >
      //               <h3 className="option">Embed on site</h3>
      //             </li>

      //             <li
      //               className={"history"}
      //               value={"history"}
                   
      //             >
      //               <h3 className="option">Conversation History</h3>
      //             </li>

      //             <li
      //               className={"leads"}
      //               value={"leads"}
                    
      //             >
      //               <h3 className="option">Leads</h3>
      //             </li>
      //           </ul>
      //           <hr />
          
      //     </div>
      //   </div>

       
      // </div>
    )
}

export default dynamic((): any => Promise.resolve(Dashboard), { ssr: false });