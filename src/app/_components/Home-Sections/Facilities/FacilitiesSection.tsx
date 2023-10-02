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
          Lorem ipsum dolor sit amet, consectetur ad consectetur adipiscing elit
          ut aliquam, purus sit amet luctus venenatis ipiscing elit ut aliquam,
          purus sit amet luctus venenatis Lorem ipsum dolor sit amet,
          consectetur ad consectetur adipiscing elit ut aliquam, purus sit amet
          luctus venenatis ipiscing elit ut aliquam, purus sit amet luctus
          venenatis.
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
              <div className="title">Key Accessibility Choice</div>
              <div className="description">
                Lorem ipsum dolor sit amet, consectetur ad consectetur
                adipiscing elit ut aliquam, purus.
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
              <div className="title">Key Accessibility Choice</div>
              <div className="description">
                Lorem ipsum dolor sit amet, consectetur ad consectetur
                adipiscing elit ut aliquam, purus.
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
              <div className="title">Key Accessibility Choice</div>
              <div className="description">
                Lorem ipsum dolor sit amet, consectetur ad consectetur
                adipiscing elit ut aliquam, purus.
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
