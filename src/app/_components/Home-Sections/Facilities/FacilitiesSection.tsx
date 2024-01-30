import React from "react";
import Image from "next/image";
import sectionImage from "../../../../../public/sections-images/facilities-section/facilities-section-img.png";
import "./facilities-section.scss";

function FacilitiesSection() {
  return (
    <>
      <div className="facilities-section-container">
        {/* --------------------------left section------------------------------ */}
        <div className="left">
          {/* --------------------------description ------------------------------ */}
          <div className="description">
            <h1 className="title">AI Chatbot Facilities</h1>
            <p className="text">
              Unlock the Power of Conversation with Lucifer.AI. Lucifer.AI
              understands and responds in human-like language, making
              interactions effortless and enjoyable. We invite you to explore
              the power of Lucifer.AI through a personalised demo. Let us show
              you how our AI chatbot can transform your digital conversations.
            </p>
          </div>

          {/* --------------------------points ------------------------------ */}
          <div className="points-container">
            <div className="point">
              <div className="number">1</div>
              <div className="description">
                <h3>Seamless Conversations</h3>
                <p>
                  Engage your website visitors, customers, and clients with
                  natural, intuitive conversations. Lucifer.AI ensures every
                  interaction is personalized, relevant, and memorable.
                </p>
              </div>
            </div>

            <div className="point">
              <div className="number">2</div>
              <div className="description">
                <h3>Integrations made easy</h3>
                <p>
                  Seamlessly integrate Lucifer.AI with your website, whatsapp,
                  or preferred tools for a unified experience.
                </p>
              </div>
            </div>

            <div className="point">
              <div className="number">3</div>
              <div className="description">
                <h3>Data-Driven Insights</h3>
                <p>
                  Understand your audience better with powerful analytics.
                  Lucifer.AI offers in-depth data to help you optimize your
                  interactions and drive results.
                </p>
              </div>
            </div>
          </div>

          {/* --------------------------demo button------------------------------ */}
          <a
            style={{ color: "white", textDecoration: "none" }}
            href="#contact-us"
          >
            <button className="request-demo-btn">Book a Demo</button>
          </a>
        </div>
        {/* --------------------------right section------------------------------ */}
        <div className="right">
          <Image src={sectionImage} alt="section-img" />
        </div>
      </div>
    </>
  );
}

export default FacilitiesSection;
