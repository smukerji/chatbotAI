"use client";
import {
  Button,
  Dropdown,
  MenuProps,
  Modal,
  Radio,
  RadioChangeEvent,
} from "antd";
import Model from "../dashboard/model/Model";
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
              <li className="active">Model</li>
              <li className="active">Transcriber</li>
              <li>Voice</li>
              <li>Tool</li>
              <li>Advance</li>
              <li>Analysis</li>

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
            <Button className="publish-button">Publish</Button>
          </div>
        </div>
      </div>
      <div className="bottom">
        

        {
          "model" == "model" && (
            <>
              <Model />
            </>
          )
        }

      </div>


    </div>


   
    

    )
}

export default dynamic((): any => Promise.resolve(Dashboard), { ssr: false });