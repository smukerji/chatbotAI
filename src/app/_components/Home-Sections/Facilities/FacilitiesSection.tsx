import React from "react";
import Image from "next/image";
import sectionImage from "../../../../../public/sections-images/facilities-section/facilities-section-img.png";
import "./facilities-section.scss";

function FacilitiesSection() {
  return (
    <>
      <div className="facilities-section-container" id="features">
        {/* --------------------------left section------------------------------ */}
        <div className="left">
          {/* --------------------------description ------------------------------ */}
          <div className="description">
            <h1 className="title">Torri.AI Features</h1>
            <p className="text">
              Utilising the latest advancements in AI and Large Language Models
              (LLMs), Torri.AI empowers users to obtain data-driven insights
              through simple conversation. This enhances the efficiency of data
              analysis and democratises access to complex data insights, making
              them available to users at all levels of technical expertise.
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
                  natural, intuitive conversations. Torri.AI ensures every
                  interaction is personalized, relevant, and memorable.
                </p>
              </div>
            </div>

            <div className="point">
              <div className="number">2</div>
              <div className="description">
                <h3>Integrations made easy</h3>
                <p>
                  Seamlessly integrate Torri.AI with your website, whatsapp,
                  or preferred tools for a unified experience.
                </p>
              </div>
            </div>

            <div className="point">
              <div className="number">3</div>
              <div className="description">
                <h3>Data-Driven Insights</h3>
                <p>
                  Torri.AI is revolutionising how companies interact with
                  their data through an advanced AI chatbot that learns directly
                  from your organisation&apos;s knowledge base. By providing a
                  conversational interface, it allows users to chat with their
                  data, making the need for traditional dashboards obsolete.
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
