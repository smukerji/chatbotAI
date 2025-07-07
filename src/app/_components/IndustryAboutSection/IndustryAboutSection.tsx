import React from "react";
import person1 from "../../../../public/sections-images/industry-about/person1.png";
import person2 from "../../../../public/sections-images/industry-about/person2.png";
import person3 from "../../../../public/sections-images/industry-about/person3.png";
import icon1 from "../../../../public/sections-images/industry-about/icon1.svg";
import icon2 from "../../../../public/sections-images/industry-about/icon2.svg";
import icon3 from "../../../../public/sections-images/industry-about/icon3.svg";
import icon4 from "../../../../public/sections-images/industry-about/icon4.svg";
import icon5 from "../../../../public/sections-images/industry-about/icon5.svg";
import "./industry-about-section.scss";
import Image from "next/image";

const IndustryAbout = () => {
  return (
    <div className="industry-about-container">
      {/* Industry Section */}
      <section className="industry-section">
        <div className="industry-content">
          <div className="industry-left">
            <span className="badge">Industry</span>
            <h2>AI That Speaks Your Industry&apos;s Language</h2>
            <div className="industry-images">
              <Image src={person1} alt="Person 1" className="person1" />
              <Image src={person2} alt="Person 2" className="person2" />
              <Image src={person3} alt="Person 3" className="person3" />
            </div>
          </div>
          <div className="industry-right">
            <div className="industry-card">
              <div className="industry-item">
                <Image src={icon2} alt="icon-2" className="icons" />
                <h3>
                  Healthcare <br />
                  Smarter support, healthier outcomes.
                </h3>
                <p>
                  Torri helps patients get accurate, 24/7 answers based on their
                  health records or service history — making every interaction
                  more personal and timely.
                </p>
              </div>
              <div className="industry-item">
                <Image src={icon1} alt="icon-1" className="icons" />
                <h3>
                  Education <br />
                  Your AI-powered learning assistant.
                </h3>
                <p>
                  From helping students navigate coursework to assisting staff
                  with admin queries, Torri makes learning support more
                  scalable, accessible, and effective.
                </p>
              </div>
              <div className="industry-item">
                <Image src={icon3} alt="icon-3" className="icons" />
                <h3>
                  Retail & DTC
                  <br />
                  Sell more. Support better. On autopilot.
                </h3>
                <p>
                  Boost customer satisfaction with AI agents that instantly
                  resolve product queries, track orders, and upsell — 24/7
                  across web, WhatsApp, and voice.
                </p>
              </div>
              <div className="industry-item">
                <Image src={icon4} alt="icon-4" className="icons" />
                <h3>
                  Hospitality
                  <br />
                  Turn every guest into a loyal one.
                </h3>
                <p>
                  Answer bookings, requests, and FAQs instantly with Torri on
                  your hotel website, WhatsApp, or kiosk — delivering a
                  personalized stay experience at scale.
                </p>
              </div>
              <div className="industry-item">
                <Image src={icon5} alt="icon-5" className="icons" />
                <h3>
                  SMBs
                  <br />
                  Big support for growing teams.
                </h3>
                <p>
                  From internal HR support to external customer service, Torri
                  helps small teams automate big workloads without complexity —
                  just plug, play, and grow
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About Us Section */}
      {/* <section className="about-section">
        <h2>About us</h2>
        <p>
          It&nbsp;s not just about reaching your users; it&nbsp;s about reaching
          them in their comfort zone. Integrate with platforms like WhatsApp,
          Telegram, and Slack for 24/7 AI-driven instant communication. Never
          let a customer request go unanswered again.
        </p>

        <div className="video-container">
          <video
            src="https://www.youtube.com/watch?v=6n6zQ8QVQ"
            controls
            className="video"
          />
        </div>
      </section> */}
    </div>
  );
};

export default IndustryAbout;
