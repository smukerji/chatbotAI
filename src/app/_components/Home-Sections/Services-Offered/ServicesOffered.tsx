import React from "react";
import "./services-offered.scss";
import Image from "next/image";
import starIcon from "../../../../../public/sections-images/service-offered-section/star.svg";
import soundIcon from "../../../../../public/sections-images/service-offered-section/sound.svg";
import documentIcon from "../../../../../public/sections-images/service-offered-section/document-code-2.svg";
import boxIcon from "../../../../../public/sections-images/service-offered-section/box-2.svg";
import textImgIcon from "../../../../../public/sections-images/service-offered-section/message-circle.svg";
import costIcon from "../../../../../public/sections-images/service-offered-section/receipt.svg";

function ServicesOffered() {
  return (
    <div className="service-offered-container" id="service-offerings">
      {/* --------------------------top section------------------------------ */}
      <div className="top">
        <div className="left-part">
          <h1>Lucifer.AI Service Offerings</h1>
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
            <Image src={starIcon} alt="service-icons" />
            <h3>Precise and accurate</h3>
            <p>No off-topic answers, accurate from your knowledge base</p>
          </div>

          <div className="service">
            <Image src={soundIcon} alt="service-icons" />
            <h3>Multilingual</h3>
            <p>Supports more than 30 languages</p>
          </div>

          <div className="service">
            <Image src={documentIcon} alt="service-icons" />
            <h3>No Code</h3>
            <p>
              1-click deployment of your chatbot, train, customize and
              personalize.
            </p>
          </div>

          <div className="service">
            <Image src={boxIcon} alt="service-icons" />
            <h3>Multi-Channel</h3>
            <p>
              Lucifer.AI is present on your website, WhatsApp, and other social
              channels.
            </p>
          </div>

          {/* <div className="service">
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
          </div> */}
        </div>
      </div>
    </div>
  );
}

export default ServicesOffered;
