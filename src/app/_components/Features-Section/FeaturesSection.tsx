"use client";
import React, { useState } from "react";
import "./feature-section.scss";
import LuciferLogo from "../../../../public/svgs/lucifer-ai-logo.svg";
import Image from "next/image";
import arrowImg from "../../../../public/sections-images/features-section/arrow-right.svg";
import img1 from "../../../../public/sections-images/features-section/Image.png";
import img2 from "../../../../public/sections-images/features-section/Image1.png";
import img3 from "../../../../public/sections-images/features-section/Image2.png";
import img4 from "../../../../public/sections-images/features-section/VoiceInput.png";
import img5 from "../../../../public/sections-images/features-section/channel.png";
import img6 from "../../../../public/sections-images/features-section/visual.png";
import Icon from "../Icon/Icon";
import RightArrowIcon from "@/assets/svg/RightArrowIcon";

function FeaturesSection() {
  const [activeKey, setActiveKey] = useState("1");
  return (
    <>
      <div className="feature-section-container" id="features">
        {/* <div className="top">
          <h1 className="title">Features</h1>

          <p className="description">
            Everything you need for your no-code AI chatbot. Add your data
            sources, train the Torri bot, customize it to your liking, and add
            it to your website, whatsapp, and telegram.
          </p>
        </div> */}

        <div className="bottom">
          <div className="left">
            <span className="badge">How It Works</span>
            <h1 className="heading">
              Chat. Talk. Listen. Learn. <br /> Repeat.
            </h1>

            <p className="intro-para">
              Your customers don&apos;t just type — they talk, they ask, they
              expect answers. Torri listens, responds, and remembers — across
              every channel. Let your team focus on strategy. Let your AI agents
              handle the busywork.
            </p>

            <div
              className={`feature ${activeKey == "1" && "active"}`}
              onClick={() => setActiveKey("1")}
            >
              <h2 className="title">
                Realistic Voice AI
                {/* <span>
                  <Icon Icon={RightArrowIcon} />
                </span> */}
              </h2>
              <p className="description">
                Give your customers a voice they&apos;ll actually enjoy talking
                to. Torri&apos;s lifelike speech, tone, and understanding make
                every interaction feel personal — not robotic.
              </p>
            </div>
            <div
              className={`feature ${activeKey == "2" && "active"}`}
              onClick={() => setActiveKey("2")}
            >
              <h2 className="title">
                Seamless Channel Switching
                {/* <span>
                  <Icon Icon={RightArrowIcon} />
                </span> */}
              </h2>
              <p className="description">
                From website to WhatsApp to voice, Torri follows the
                conversation wherever your users are — without ever losing
                context or momentum.
              </p>
            </div>
            <div
              className={`feature ${activeKey == "3" && "active"}`}
              onClick={() => setActiveKey("3")}
            >
              <h2 className="title">
                Visual Search & Voice Input
                {/* <span>
                  <Icon Icon={RightArrowIcon} />
                </span> */}
              </h2>
              <p className="description">
                Soon, your customers will show instead of tell. Torri will see
                what they see and respond — making the future of interaction
                frictionless, intuitive, and visual.
              </p>
            </div>
          </div>
          <div className="right">
            {/* <Image src={img4} alt="image" loading="lazy" /> */}

            {activeKey == "1" ? (
              <Image src={img4} alt="image" loading="lazy" />
            ) : activeKey == "2" ? (
              <Image src={img5} alt="image" loading="lazy" />
            ) : activeKey == "3" ? (
              <Image src={img6} alt="image" loading="lazy" />
            ) : (
              ""
            )}
          </div>
        </div>
      </div>

      {/* <section className="features-section">
        <div className="header">
          <span className="feature-badge">Features</span>
          <h2>Simplifying, Automating and Enriching Human Potential</h2>
        </div>
        <div className="features-grid">
          <div className="feature-card">
            <h3>Sarah your AI Customer Service Assistant</h3>
            <p>
              Engage your website visitors, customers, and clients with natural,
              intuitive conversations. Torri ensures every interaction is
              personalized, relevant, and memorable.
            </p>

            <div className="image-div"></div>
          </div>
          <div className="feature-card">
            <h3>Tob your AI Sales Assistant</h3>
            <p>
              Engage your website visitors, customers, and clients with natural,
              intuitive conversations. Torri ensures every interaction is
              personalized, relevant, and memorable.
            </p>
            <div className="image-div"></div>
          </div>
        </div>

        <div className="features-grid">
          {[1, 2, 3].map((_, index) => (
            <div key={index} className="feature-card">
              <h3>Seamless Conversations</h3>
              <p>
                Engage your website visitors, customers, and clients with
                natural, intuitive conversations. Torri ensures every
                interaction is personalized, relevant, and memorable.
              </p>
              <div className="image-div"></div>
            </div>
          ))}
        </div>
      </section> */}
    </>
  );
}

export default FeaturesSection;
