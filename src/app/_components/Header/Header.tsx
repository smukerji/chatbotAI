import React from "react";
import LuciferLogo from "../../../../public/svgs/lucifer-ai-logo.svg";
import Image from "next/image";
import { Progress } from "antd";
import "./header.scss";
import { useCookies } from "react-cookie";

function Header() {
  const [cookies, setCookie] = useCookies(["profile-img"]);
  return (
    <div className="header-container">
      {/*------------------------------------------logo----------------------------------------------*/}
      <Image className="logo" src={LuciferLogo} alt="img-logo" />

      <div className="header-content">
        {/*------------------------------------------messages limit----------------------------------------------*/}
        <div className="messages-limit-container">
          <span>Messages</span>
          <Progress strokeLinecap="butt" percent={75} showInfo={false} />
          <span>
            <span style={{ color: "#141416" }}>24</span>/100
          </span>
        </div>

        {/*------------------------------------------feedback-btn----------------------------------------------*/}
        <button className="feedback-btn">Feedback</button>
        {/*------------------------------------------Profile Image----------------------------------------------*/}

        {cookies?.["profile-img"] ? (
          <Image
            width={40}
            height={40}
            // style={{ borderRadius: "50%" }}
            className="profile-img"
            src={cookies?.["profile-img"]}
            alt="profile-img"
          />
        ) : (
          <div className="profile-img">
            <span>SS</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default Header;
