import React from "react";
import "./industry-section.css";
import Image from "next/image";
import BankImg from "../../../../../public/sections-images/industry-section/banks.png";
import EducationImg from "../../../../../public/sections-images/industry-section/education.png";
import GovernmentImg from "../../../../../public/sections-images/industry-section/government.png";
import HealthImg from "../../../../../public/sections-images/industry-section/health.png";
import HotelImg from "../../../../../public/sections-images/industry-section/hotel.png";
import NonProfitImg from "../../../../../public/sections-images/industry-section/non-profit.png";

function IndustrySection() {
  return (
    <div className="industry-section-container">
      {/* ------------------------------top section------------------------------- */}
      <div className="top">
        <div className="industry-text">
          INDUSTRIAL
          <h1 className="industry-welcome-text">
            AI CHATBOT IN {<br />} THE INDUSTRIAL SECTOR
          </h1>
          {/* <hr className="industry-welcome-text-decorator" /> */}
        </div>

        <div className="section-text">
          Discover the future of conversational excellence with Lucifer.ai, your
          intelligent AI companion. Elevate your online interactions with
          natural and intuitive conversations.
        </div>

        <button className="contact-demo-button">Contact for demo</button>
      </div>

      {/* ------------------------------bottom section------------------------------- */}
      <div className="bottom">
        {/*--------sectors-row-one--------*/}
        <div className="sector-row-one-container">
          {/*--------sector-1--------*/}
          <div className="sector-holder left">
            <div className="sector">
              <div className="content">
                <div className="img-wrapper left green">
                  <Image alt="img" src={HealthImg} />
                </div>
                <div className="title green">Healthcare and Wellness</div>
                <div className="sub-title">
                  Use conversational AI to create patient summary, read
                  appointments & providing medical FAQs to patients
                </div>
              </div>
            </div>
            <div className="sector-outer green"></div>
          </div>

          {/*--------sector-2--------*/}
          <div className="sector-holder right">
            <div className="sector">
              <div className="content">
                <div className="img-wrapper right purple">
                  <Image alt="img" src={HotelImg} />
                </div>
                <div className="title purple">Hotels and Hospitality</div>
                <div className="sub-title">
                  Contract management, supplier list creation, managing customer
                  queries can be transformed using Lucifer.ai
                </div>
              </div>
            </div>
            <div className="sector-outer purple"></div>
          </div>
        </div>

        {/*--------sectors-row-two--------*/}
        <div className="sector-row-two-container">
          {/*--------sector-3--------*/}
          <div className="sector-holder left">
            <div className="sector">
              <div className="content">
                <div className="img-wrapper left blue">
                  <Image alt="img" src={EducationImg} />
                </div>
                <div className="title blue">Education and Institutes</div>
                <div className="sub-title">
                  Build your own AI tutor using Lucifer.ai. Creating
                  personalised content for personalised learning.
                </div>
              </div>
            </div>
            <div className="sector-outer blue"></div>
          </div>

          {/*--------center of all sectors--------*/}
          <div className="center-of-sectors-holder">
            <div className="center-sector">
              <h2 className="center-content">LLM CHATBOT</h2>
            </div>
            <div className="center-sector-outer"></div>
          </div>

          {/*--------sector-4--------*/}
          <div className="sector-holder right">
            <div className="sector">
              <div className="content">
                <div className="img-wrapper right pink">
                  <Image alt="img" src={NonProfitImg} />
                </div>
                <div className="title pink">Nonprofits or B2C</div>
                <div className="sub-title">
                  Gen-AI can support in enhancing Contract summarisation,
                  customer enquiries and call center management
                </div>
              </div>
            </div>
            <div className="sector-outer pink"></div>
          </div>
        </div>

        {/*--------sectors-row-three--------*/}
        <div className="sector-row-three-container">
          {/*--------sector-5--------*/}
          <div className="sector-holder left">
            <div className="sector">
              <div className="content">
                <div className="img-wrapper left darkpink">
                  <Image alt="img" src={BankImg} />
                </div>
                <div className="title darkpink">Small Medium Businesses</div>
                <div className="sub-title">
                  Building AI agents and chat interfaces to support business
                  operations. AI helps SMEs reduce cost and gain productivity
                </div>
              </div>
            </div>
            <div className="sector-outer darkpink"></div>
          </div>

          {/*--------sector-6--------*/}
          {/* <div className="sector-holder right">
            <div className="sector">
              <div className="content">
                <div className="img-wrapper yellow right">
                  <Image alt="img" src={GovernmentImg} />
                </div>
                <div className="title yellow">Government & Federal States</div>
                <div className="sub-title">
                  Lorem ipsum dolor sit amet, consectetur ad consectetur
                  adipiscing elit ut aliquam, purus.
                </div>
              </div>
            </div>
            <div className="sector-outer yellow"></div>
          </div> */}
        </div>
      </div>
    </div>
  );
}

export default IndustrySection;
