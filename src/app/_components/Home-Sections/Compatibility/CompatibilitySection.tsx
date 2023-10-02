import React from "react";
import "./compatibility-section.css";
import Image from "next/image";
import RightArrowImg from "../../../../../public/sections-images/common/arrow-right-circle.svg";
import LadyImg from "../../../../../public/sections-images/compatibility-section/lady 1.png";
import EllipseImg from "../../../../../public/sections-images/compatibility-section/Group 1.svg";

function CompatibilitySection() {
  return (
    <div className="compatibility-section-container">
      {/* ------------------------------top section------------------------------- */}
      <div className="top">
        <div className="compatibility-text">
          COMPATIBILITY
          <div className="compatibility-welcome-text">
            COMPATIBILITY WITH CMS AND PLATFORMS
          </div>
        </div>

        <div className="section-text">
          We are offering an accessible interface to CMS or other platforms
          friendly for disabilities.
        </div>

        <Image className="ellipse-img" src={EllipseImg} alt="ellipse-img" />
      </div>

      {/* ------------------------------bottom section------------------------------- */}
      <div className="bottom">
        {/* ------------------------------bottom-left section------------------------------- */}
        <div className="left">
          <div className="points-container">
            <ul>
              <li>
                <span>
                  <Image src={RightArrowImg} alt="right-arrow-img" />
                </span>
                <span>
                  Integrate accessibility solutions into the overall &quot;look
                  and feel&quot;.
                </span>
              </li>
              <li>
                <span>
                  <Image src={RightArrowImg} alt="right-arrow-img" />
                </span>
                <span>Promote accessibility in help and documentation.</span>
              </li>
              <li>
                <span>
                  <Image src={RightArrowImg} alt="right-arrow-img" />
                </span>
                <span>
                  Ensure that the authoring tool is accessible to authors with
                  disabilities.
                </span>
              </li>
              <li>
                <span>
                  <Image src={RightArrowImg} alt="right-arrow-img" />
                </span>
                <span>Accessible templates and documentation.</span>
              </li>
              <li>
                <span>
                  <Image src={RightArrowImg} alt="right-arrow-img" />
                </span>
                <span>
                  Generate standard markup and creation of accessible content.
                </span>
              </li>
              <li>
                <span>
                  <Image src={RightArrowImg} alt="right-arrow-img" />
                </span>
                <span>
                  Define ways of checking and correcting inaccessible content.
                </span>
              </li>
            </ul>
          </div>
          <button className="contact-demo-button">Contact for demo</button>
        </div>

        {/* ------------------------------bottom-right section------------------------------- */}
        <div className="right">
          <Image src={LadyImg} alt="lady-arrow-img" />
        </div>
      </div>
    </div>
  );
}

export default CompatibilitySection;
