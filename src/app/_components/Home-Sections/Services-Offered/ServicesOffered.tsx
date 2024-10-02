import React from "react";
import "./services-offered.scss";
import Image from "next/image";
import LuciferLogo from "../../../../../public/svgs/lucifer-ai-logo.svg";
import starIcon from "../../../../../public/sections-images/service-offered-section/star.webp";
import soundIcon from "../../../../../public/sections-images/service-offered-section/sound.webp";
import documentIcon from "../../../../../public/sections-images/service-offered-section/document-code-2.webp";
import boxIcon from "../../../../../public/sections-images/service-offered-section/box-2.webp";
import textImgIcon from "../../../../../public/sections-images/service-offered-section/message-circle.svg";
import costIcon from "../../../../../public/sections-images/service-offered-section/receipt.svg";
import Link from "next/link";

function ServicesOffered() {
  return (
    <div className="service-offered-container" id="service-offerings">
      {/* --------------------------top section------------------------------ */}
      <div className="top">
        {/* <Image src={LuciferLogo} alt='' /> */}
        <h1>Service Offerings</h1>
        <div className="sub-parent">
          <div className="left-part">
            <p>
              Torri AI is the AI chatbot that takes your digital presence to the
              next level. Join us on this extraordinary journey, where
              conversation meets innovation. Experience Torri AI today, and
              never look back.
            </p>
          </div>

          <div className="right-part">
            <Link
              style={{ color: "white", textDecoration: "none" }}
              href="/account/register"
            >
              <button className="request-demo-btn">
                Register for Torri AI
              </button>
            </Link>
          </div>
        </div>
      </div>
      {/* --------------------------bottom section------------------------------ */}
      <div className="bottom">
        <div className="services-container">
          <div className="service">
            <Image
              src={starIcon}
              alt="service-icons"
              width={60}
              height={60}
              loading="lazy"
            />
            <h3>Precise and accurate</h3>
            <p>No off-topic answers, accurate from your knowledge base</p>
          </div>

          <div className="service">
            <Image
              src={soundIcon}
              alt="service-icons"
              width={60}
              height={60}
              loading="lazy"
            />
            <h3>Multilingual</h3>
            <p>Supports more than 30 languages</p>
          </div>

          <div className="service">
            <Image
              src={documentIcon}
              alt="service-icons"
              width={60}
              height={60}
              loading="lazy"
            />
            <h3>No Code</h3>
            <p>
              1-click deployment of your AI chatbot, train, customize and
              personalize.
            </p>
          </div>

          <div className="service">
            <Image
              src={boxIcon}
              alt="service-icons"
              width={60}
              height={60}
              loading="lazy"
            />
            <h3>Multi-Channel</h3>
            <p>
              Torri AI is present on your website, WhatsApp, and other social
              channels.
            </p>
          </div>

          {/* <div className="service">
            <Image src={textImgIcon} alt="service-icons" />
            <h3>Text-Image-Audio chatbot</h3>
            <p>
              Torri.AI is the AI chatbot that takes your digital presence to
              the next level
            </p>
          </div>

          <div className="service">
            <Image src={costIcon} alt="service-icons" />
            <h3>Chatbot Cost Estimation</h3>
            <p>
              Torri.AI is the AI chatbot that takes your digital presence to
              the next level
            </p>
          </div> */}
        </div>
      </div>
    </div>
  );
}

export default ServicesOffered;
