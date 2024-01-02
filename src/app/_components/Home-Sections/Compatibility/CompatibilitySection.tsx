import React from "react";
import Image from "next/image";
import backImg from "../../../../../public/sections-images/compatibility-section/compaatibility-section-img.png";
import arrowIcon from "../../../../../public/sections-images/compatibility-section/arrow-circle-right.svg";
import "./compatibility-section.scss";

function CompatibilitySection() {
  return (
    <div className="compatibility-section-container">
      {/* --------------------------left section------------------------------ */}
      <div className="left">
        <h1>Compatibility with WhatsApp and any platforms</h1>
        <p>
          We are offering an accessible interface to website or other platforms.
        </p>
        <Image src={backImg} alt="img-backgorund" />
      </div>

      {/* --------------------------right section------------------------------ */}
      <div className="right">
        <div className="points-container">
          <div className="point">
            <Image src={arrowIcon} alt="point-icon" />
            <h3>
              Integrate accessibility solutions into the overall &quot;look and
              feel&quot;.
            </h3>
          </div>

          <div className="point">
            <Image src={arrowIcon} alt="point-icon" />
            <h3>Promote accessibility in help and documentation.</h3>
          </div>

          <div className="point">
            <Image src={arrowIcon} alt="point-icon" />
            <h3>
              Ensure that the authoring tool is accessible to authors with
              disabilities.
            </h3>
          </div>

          <div className="point">
            <Image src={arrowIcon} alt="point-icon" />
            <h3>Accessible templates and documentation.</h3>
          </div>

          <div className="point">
            <Image src={arrowIcon} alt="point-icon" />
            <h3>
              Generate standard markup and creation of accessible content.
            </h3>
          </div>

          <div className="point">
            <Image src={arrowIcon} alt="point-icon" />
            <h3>
              Define ways of checking and correcting inaccessible content.
            </h3>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CompatibilitySection;
