import React from "react";
import "./services-offered.scss";
import Image from "next/image";
import langIcon from "../../../../../public/sections-images/service-offered-section/bubble.svg";
import webIcon from "../../../../../public/sections-images/service-offered-section/3dcube.svg";
import monitorIcon from "../../../../../public/sections-images/service-offered-section/chart-2.svg";
import naturalLangIcon from "../../../../../public/sections-images/service-offered-section/speedometer.svg";
import textImgIcon from "../../../../../public/sections-images/service-offered-section/message-circle.svg";
import costIcon from "../../../../../public/sections-images/service-offered-section/receipt.svg";

function ServicesOffered() {
  return (
    <div className="service-offered-container">
      {/* --------------------------top section------------------------------ */}
      <div className="top">
        <div className="left-part">
          <h1>Services We Offer</h1>
          <p>
            Lucifer.AI is the AI chatbot that takes your digital presence to the
            next level. Join us on this extraordinary journey, where
            conversation meets innovation. Experience Lucifer.AI today, and
            never look back.
          </p>
        </div>

        <div className="right-part">
          <a
            style={{ color: "white", textDecoration: "none" }}
            href="#contact-us"
          >
            <button className="request-demo-btn">Book a Demo</button>
          </a>
        </div>
      </div>
      {/* --------------------------bottom section------------------------------ */}
      <div className="bottom">
        <div className="services-container">
          <div className="service">
            <Image src={langIcon} alt="service-icons" />
            <h3>Multi- language Support</h3>
            <p>
              Lucifer.AI is the AI chatbot that takes your digital presence to
              the next level
            </p>
          </div>

          <div className="service">
            <Image src={webIcon} alt="service-icons" />
            <h3>Web Chatbot Integration</h3>
            <p>
              Lucifer.AI is the AI chatbot that takes your digital presence to
              the next level
            </p>
          </div>

          <div className="service">
            <Image src={monitorIcon} alt="service-icons" />
            <h3>App chatbot Monitoring</h3>
            <p>
              Lucifer.AI is the AI chatbot that takes your digital presence to
              the next level
            </p>
          </div>

          <div className="service">
            <Image src={naturalLangIcon} alt="service-icons" />
            <h3>Natural Language Processing</h3>
            <p>
              Lucifer.AI is the AI chatbot that takes your digital presence to
              the next level
            </p>
          </div>

          <div className="service">
            <Image src={textImgIcon} alt="service-icons" />
            <h3>Text-Image-Audio chatbot</h3>
            <p>
              Lucifer.AI is the AI chatbot that takes your digital presence to
              the next level
            </p>
          </div>

          <div className="service">
            <Image src={costIcon} alt="service-icons" />
            <h3>Chatbot Cost Estimation</h3>
            <p>
              Lucifer.AI is the AI chatbot that takes your digital presence to
              the next level
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ServicesOffered;
