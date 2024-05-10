import React from "react";
import "./hero-section.scss";
import Image from "next/image";
import HeaderImage from "../../../../public/sections-images/header-background/Group1.png";
import freeTrialIcon from "../../../../public/sections-images/header-background/discount-shape.svg";
import creditCardIcon from "../../../../public/sections-images/header-background/card-pos.svg";
import cancelIcon from "../../../../public/sections-images/header-background/clipboard-close.svg";

function HeroSection() {
  return (
    <>
      <div className="hero-section-container">
        <h1 className="title">
          Seamless Support Starts Here: AI-Powered Solutions for Every Customer
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
          <a
            style={{ color: "white", textDecoration: "none" }}
            href="/account/register"
          >
            <button className="request-demo-btn">Join Beta!</button>
          </a>
        </div>
        <div className="schemes-list">
          <ul>
            <li>
              <span>
                <Image src={freeTrialIcon} alt="free-trial-icon" />
              </span>
              <span>Free 7-day trial</span>
            </li>
            <li>
              <span>
                <Image src={creditCardIcon} alt="credit-card-icon" />
              </span>
              <span>No credit card required</span>
            </li>
            <li>
              <span>
                <Image src={cancelIcon} alt="cancel-icon" />
              </span>
              <span>Cancel anytime</span>
            </li>
          </ul>
        </div>

        <div className="grp-img">
          <Image src={HeaderImage} alt="image" />
        </div>
      </div>
    </>
  );
}

export default HeroSection;
