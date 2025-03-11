"use client";
import React, { useState } from "react";
import "./feature-section.scss";
import LuciferLogo from "../../../../public/svgs/lucifer-ai-logo.svg";
import Image from "next/image";
import arrowImg from "../../../../public/sections-images/features-section/arrow-right.svg";
import img1 from "../../../../public/sections-images/features-section/Image.png";
import img2 from "../../../../public/sections-images/features-section/Image1.png";
import img3 from "../../../../public/sections-images/features-section/Image2.png";
import Icon from "../Icon/Icon";
import RightArrowIcon from "@/assets/svg/RightArrowIcon";

function FeaturesSection() {
  const [activeKey, setActiveKey] = useState("1");
  return (
    <>
      {/* <div className="feature-section-container" id="features">
        <div className="top">
          <h1 className="title">Features</h1>

          <p className="description">
            Everything you need for your no-code AI chatbot. Add your data
            sources, train the Torri bot, customize it to your liking, and add
            it to your website, whatsapp, and telegram.
          </p>
        </div>

        <div className="bottom">
          <div className="left">
            <div
              className={`feature ${activeKey == "1" && "active"}`}
              onClick={() => setActiveKey("1")}
            >
              <h2 className="title">
                Seamless Conversations{" "}
                <span>
                  <Icon Icon={RightArrowIcon} />
                </span>
              </h2>
              <p className="description">
                Engage your website visitors, customers, and clients with
                natural, intuitive conversations. Torri AI ensures every
                interaction is personalised, relevant, and memorable.
              </p>
            </div>
            <div
              className={`feature ${activeKey == "2" && "active"}`}
              onClick={() => setActiveKey("2")}
            >
              <h2 className="title">
                Integrations made easy{" "}
                <span>
                  <Icon Icon={RightArrowIcon} />
                </span>
              </h2>
              <p className="description">
                Seamlessly integrate Torri AI with your website, WhatsApp, or
                preferred tools for a unified experience.
              </p>
            </div>
            <div
              className={`feature ${activeKey == "3" && "active"}`}
              onClick={() => setActiveKey("3")}
            >
              <h2 className="title">
                Data-Driven Insights{" "}
                <span>
                  <Icon Icon={RightArrowIcon} />
                </span>
              </h2>
              <p className="description">
                Torri AI is revolutionising how companies interact with their
                data through an advanced AI chatbot that learns directly from
                your organisation&apos;s knowledge base.
              </p>
            </div>
          </div>
          <div className="right">
            {activeKey == "1" ? (
              <Image src={img1} alt="image" loading="lazy" />
            ) : activeKey == "2" ? (
              <Image src={img2} alt="image" loading="lazy" />
            ) : activeKey == "3" ? (
              <Image src={img3} alt="image" loading="lazy" />
            ) : (
              ""
            )}
          </div>
        </div>
      </div> */}

      <section className="features-section">
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
      </section>
    </>
  );
}

export default FeaturesSection;
