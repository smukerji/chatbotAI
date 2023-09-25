import React from "react";
import "./ai-chatbot-section.css";
import Image from "next/image";
import Sectionimg from "../../../../../public/sections-images/ai-chatbot-section/image 52.png";
import BottomLeftOuterEllipse from "../../../../../public/sections-images/common/Ellipse 98.svg";
import BottomLeftInnerEllipse from "../../../../../public/sections-images/common/Ellipse 15.svg";
import TopRightEllipse from "../../../../../public/sections-images/common/Ellipse 62.svg";

function AIChatbotSection() {
  return (
    <>
      <div className="ai-chatbot-section-container">
        {/* ------------------------------left section------------------------------- */}
        <div className="left">
          <div className="ai-chatbot-text">AI CHATBOT</div>
          <div className="welcome-text">Wel Come to AI CHATBOT</div>
          <hr className="welcome-text-decorator" />
          <div className="section-text">
            Lorem ipsum dolor sit amet, consectetur ad consectetur adipiscing
            elit ut aliquam, purus sit amet luctus venenatis ipiscing elit ut
            aliquam, purus sit amet luctus venenatis
          </div>
          <div className="request-demo-email-container">
            <input type="text" placeholder="Enter your email" />
            <button className="request-demo-btn">Request Demo</button>
          </div>
        </div>

        {/* ------------------------------right section------------------------------- */}
        <div className="right">
          <div className="image-container">
            <div className="image-polygon">
              <Image src={Sectionimg} alt="ai-chatbot-section-image" />
              <div className="ellipse-1">
                <div className="ellipse-2">
                  <div className="ellipse-3"></div>
                </div>
              </div>
              <Image
                className="ellipse-bottom-left-outer-image"
                src={BottomLeftOuterEllipse}
                alt="Bottom Left Outer Ellipse"
              />

              <Image
                className="ellipse-bottom-left-inner-image"
                src={BottomLeftInnerEllipse}
                alt="Bottom Left Inner Ellipse"
              />

              <Image
                className="ellipse-top-right-image"
                src={TopRightEllipse}
                alt="Top right Ellipse"
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default AIChatbotSection;
