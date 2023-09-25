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
          Lorem ipsum dolor sit amet, consectetur ad Lorem ipsum dolor sit amet,
          consectetur ad consectetur adipiscing elit ut aliquam,
          purus.consectetur adipiscing elit ut aliquam, purus.
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
            <hr className="services-connector"/>
            <div className="text">AI-Based Audit Tools</div>
          </div>

          {/* ------------------------------service 2------------------------------- */}
          <div className="service-holder">
            <div className="img">
              <Image alt="img" src={Service2} />
            </div>
            <div className="text">Web Chatbot Remediation</div>
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
            <div className="text">Responsiblity Consulting</div>
          </div>

          {/* ------------------------------service 5------------------------------- */}
          <div className="service-holder">
            <div className="img">
              <Image alt="img" src={Service5} />
            </div>
            <div className="text">Multimedia chatbot</div>
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
