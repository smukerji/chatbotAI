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
import Transcriber from "./transcriber/Transcriber";
function Dashboard() {

  let [tab, setTab] = useState<string>("model");;

  let tabValue = "model";

  const changeHandler = (value: string) => {
    console.log("working , clicking")
    setTab(value);
  }


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
              <li className={tab == "model" ? "active" : ""} onClick={()=> changeHandler("model")}>Model</li>
              <li className={tab == "transcriber" ? "active" : ""} onClick={() => changeHandler("transcriber")}>Transcriber</li>
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
          tab == "model" && (
            <>
              <Model />
            </>
          )
        }

        {
          tab == "transcriber" && (
            <>
              <Transcriber />
            </>
          )
        }

      </div>


    </div>


   
    

    )
}

export default dynamic((): any => Promise.resolve(Dashboard), { ssr: false });