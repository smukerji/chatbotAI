import React from "react";
import "./service-section.css";
import Image from "next/image";
import Service1 from "../../../../../public/sections-images/services-section/service-1.png";
import Service2 from "../../../../../public/sections-images/services-section/service-2.png";
import Service3 from "../../../../../public/sections-images/services-section/service-3.png";
import Service4 from "../../../../../public/sections-images/services-section/service-4.png";
import Service5 from "../../../../../public/sections-images/services-section/service-5.png";
import Service6 from "../../../../../public/sections-images/services-section/service-6.png";

function ServicesSection() {
  return (
    <div className="service-section-container">
      {/* ------------------------------top section------------------------------- */}
      <div className="top">
        <div className="service-text">
          SERVICES
          <div className="service-welcome-text">SERVICES WE OFFER</div>
        </div>

        <div className="section-text">
          Lucifer.ai is the AI chatbot that takes your digital presence to the
          next level. Join us on this extraordinary journey, where conversation
          meets innovation. Experience Lucifer.ai today, and never look back.
        </div>

        <button className="contact-demo-button">Contact for demo</button>
      </div>

      {/* ------------------------------bottom section------------------------------- */}
      <div className="bottom">
        <div className="services-container">
          {/* ------------------------------service 1------------------------------- */}
          <div className="service-holder">
            <div className="img">
              <Image alt="img" src={Service1} />
            </div>
            <hr className="services-connector" />
            <div className="text">Multi- language Support</div>
          </div>

          {/* ------------------------------service 2------------------------------- */}
          <div className="service-holder">
            <div className="img">
              <Image alt="img" src={Service2} />
            </div>
            <div className="text">Web Chatbot Integration</div>
          </div>

          {/* ------------------------------service 3------------------------------- */}
          <div className="service-holder">
            <div className="img">
              <Image alt="img" src={Service3} />
            </div>
            <div className="text">App chatbot Monitoring</div>
          </div>

          {/* ------------------------------service 4------------------------------- */}
          <div className="service-holder">
            <div className="img">
              <Image alt="img" src={Service4} />
            </div>
            <div className="text">Natural Language Processing</div>
          </div>

          {/* ------------------------------service 5------------------------------- */}
          <div className="service-holder">
            <div className="img">
              <Image alt="img" src={Service5} />
            </div>
            <div className="text">Text-Image-Audio chatbot</div>
          </div>

          {/* ------------------------------service 6------------------------------- */}
          <div className="service-holder">
            <div className="img">
              <Image alt="img" src={Service6} />
            </div>
            <div className="text">Chatbot Cost Estimation</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ServicesSection;
