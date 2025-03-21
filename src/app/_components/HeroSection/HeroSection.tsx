import React from "react";
import "./hero-section.scss";
import Image from "next/image";
// import LineImage from "../../../../public/sections-images/header-background/Lines.png";
import HeaderImage from "../../../../public/sections-images/header-background/Group1.svg";
import messageIcon from "../../../../public/sections-images/header-background/message-text.svg";
import cancelIcon from "../../../../public/sections-images/header-background/clipboard-close.webp";
import Link from "next/link";

function HeroSection() {
  return (
    <>
      <div
        className="hero-section-container"
        // style={{ backgroundImage: `url(${LineImage.src})` }}
      >
        <h1 className="title">
          Seamless Support Starts Here: AI Chatbot Solutions for Every Customer
          Query
        </h1>

        <p className="description">
          Elevate your customer service experience to new heights by empowering
          your audience with the instant, reliable answers they seek, any time
          of the day. Torri AI scans your website, help center or other sources
          to provide quick and accurate AI-generated answers to customer
          questions.
        </p>

        <div className="request-demo-email-container">
          {/* <div className="email-input">
            <input type="text" placeholder="Enter your email" />
          </div> */}
          <Link
            style={{ color: "white", textDecoration: "none" }}
            href="/account/register"
          >
            <button className="request-demo-btn">Join with $1</button>
          </Link>
        </div>
        <div className="schemes-list">
          <ul>
            {/* <li>
              <span>
                <Image
                  src={freeTrialIcon}
                  alt="free-trial-icon"
                  loading="lazy"
                  width={23}
                  height={23}
                />
              </span>
              <span>Free 7-day trial</span>
            </li> */}
            <li>
              <span>
                <Image
                  src={messageIcon}
                  alt="msg-icon"
                  loading="lazy"
                  width={23}
                  height={23}
                />
              </span>
              <span>Conversational Bot in 1 minute</span>
            </li>
            <li>
              <span>
                <Image
                  src={cancelIcon}
                  alt="cancel-icon"
                  loading="lazy"
                  width={23}
                  height={23}
                />
              </span>
              <span>Cancel anytime</span>
            </li>
          </ul>
        </div>

        <div className="grp-img">
          <Image src={HeaderImage} alt="image" fill />
        </div>
      </div>
    </>
  );
}

export default HeroSection;
