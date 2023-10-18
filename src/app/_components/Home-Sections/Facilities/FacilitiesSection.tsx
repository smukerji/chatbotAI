import React from "react";
import "./facilities-section.css";
import Image from "next/image";
import FacilityOneImage from "../../../../../public/sections-images/facilities-section/consulting 1.png";
import FacilityTwoImage from "../../../../../public/sections-images/facilities-section/communication 1.png";
import FacilityThreeImage from "../../../../../public/sections-images/facilities-section/report 1.png";
import SectionImg from "../../../../../public/sections-images/facilities-section/Group 50.svg";

function FacilitiesSection() {
  return (
    <div className="facility-section-container">
      {/* ------------------------------left section------------------------------- */}
      <div className="left">
        <div className="facility-text">
          FACILITIES
          <div className="facility-welcome-text">AI CHATBOT FACILITIES</div>
        </div>

        <div className="section-text">
          Unlock the Power of Conversation with Lucifer.ai. Lucifer.ai
          understands and responds in human-like language, making interactions
          effortless and enjoyable. We invite you to explore the power of
          Lucifer.ai through a personalised demo. Let us show you how our AI
          chatbot can transform your digital conversations.
        </div>

        {/* ------------------------------facilities-list-start------------------------------- */}
        <div className="facilities-list-container">
          {/* ------------------------------facility 1------------------------------- */}
          <div className="facility">
            <Image
              className="icon"
              src={FacilityOneImage}
              alt="facilityimage"
            />
            <div className="description-container">
              <div className="title">Seamless Conversations</div>
              <div className="description">
                Engage your website visitors, customers, and clients with
                natural, intuitive conversations. Lucifer.ai ensures every
                interaction is personalized, relevant, and memorable.
              </div>
            </div>
          </div>

          {/* ------------------------------facility 2------------------------------- */}
          <div className="facility">
            <Image
              className="icon"
              src={FacilityTwoImage}
              alt="facilityimage"
            />
            <div className="description-container">
              <div className="title">Integrations made easy</div>
              <div className="description">
                Seamlessly integrate Lucifer.ai with your website, whatsapp, or
                preferred tools for a unified experience.
              </div>
            </div>
          </div>

          {/* ------------------------------facility 3------------------------------- */}
          <div className="facility">
            <Image
              className="icon"
              src={FacilityThreeImage}
              alt="facility-image"
            />
            <div className="description-container">
              <div className="title">Data-Driven Insights</div>
              <div className="description">
                Understand your audience better with powerful analytics.
                Lucifer.ai offers in-depth data to help you optimize your
                interactions and drive results.
              </div>
            </div>
          </div>
        </div>
        {/* ------------------------------facilities-list-end------------------------------- */}

        <button className="contact-demo-button">Contact for demo</button>
      </div>

      {/* ------------------------------right section------------------------------- */}
      <div className="right">
        <Image src={SectionImg} alt="facilities-section-image" />
      </div>
    </div>
  );
}

export default FacilitiesSection;
