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
            <h2>Digital Workers supporting at every business landscape</h2>
            <div className="industry-images">
              <Image src={person1} alt="Person 1" className="person1" />
              <Image src={person2} alt="Person 2" className="person2" />
              <Image src={person3} alt="Person 3" className="person3" />
            </div>
          </div>
          <div className="industry-right">
            <div className="industry-card">
              <div className="industry-item">
                <Image src={icon1} alt="icon-1" className="icons" />
                <h3>Education and Institutes</h3>
                <p>
                  Torri AI is intelligent to find answers for your for your
                  research papers, and books. Upload a book and chat with it.
                </p>
              </div>
              <div className="industry-item">
                <Image src={icon2} alt="icon-2" className="icons" />
                <h3>Healthcare and Wellness</h3>
                <p>
                  Torri AI can provide intelligent support to your customers
                  needs based on their health records. Make it personalised and
                  available 24/7
                </p>
              </div>
              <div className="industry-item">
                <Image src={icon3} alt="icon-3" className="icons" />
                <h3>Small Medium Business</h3>
                <p>
                  Torri AI can transform your customer support experience with
                  swift query resolutions, available 24/7
                </p>
              </div>
              <div className="industry-item">
                <Image src={icon4} alt="icon-4" className="icons" />
                <h3>Hotels and Hospitality</h3>
                <p>
                  Add an AI-chatbot to your website, whatsapp, telegram with a
                  simple embed code to provide personalised experience about
                  your hotel information.
                </p>
              </div>
              <div className="industry-item">
                <Image src={icon5} alt="icon-5" className="icons" />
                <h3>Nonprofits or B2C</h3>
                <p>
                  Add Torri AI to your website, whatsapp, telegram for your
                  staff to find any projects and documents. Chat with your
                  projects.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About Us Section */}
      <section className="about-section">
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
      </section>
    </div>
  );
};

export default IndustryAbout;
