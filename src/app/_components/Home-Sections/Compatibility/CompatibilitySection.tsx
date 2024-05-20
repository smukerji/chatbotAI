import React from "react";
import Image from "next/image";
import backImg from "../../../../../public/sections-images/compatibility-section/compaatibility-section-img.png";
import Compatibility from "../../../../../public/sections-images/compatibility-section/compatibility-wp.webp";
import arrowIcon from "../../../../../public/sections-images/compatibility-section/arrow-circle-right.webp";
import "./compatibility-section.scss";

function CompatibilitySection() {
  return (
    <div className="compatibility-section-container">
      {/* --------------------------left section------------------------------ */}
      <div className="left">
        <h1>Compatibility with WhatsApp and any platforms</h1>
        <p className="description">
          We are offering an accessible interface to website or other platforms.
        </p>
        <div className="points-container">
          <div className="point">
            <Image
              src={arrowIcon}
              alt="point-icon"
              width={40}
              height={40}
              loading="lazy"
            />
            <p className="details">
              Integrate accessibility solutions into the overall &quot;look and
              feel&quot;.
            </p>
          </div>

          <div className="point">
            <Image
              src={arrowIcon}
              alt="point-icon"
              width={40}
              height={40}
              loading="lazy"
            />
            <p className="details">
              Promote accessibility in help and documentation.
            </p>
          </div>

          <div className="point">
            <Image
              src={arrowIcon}
              alt="point-icon"
              width={40}
              height={40}
              loading="lazy"
            />
            <p className="details">
              Ensure that the authoring tool is accessible to authors with
              disabilities.
            </p>
          </div>

          <div className="point">
            <Image
              src={arrowIcon}
              alt="point-icon"
              width={40}
              height={40}
              loading="lazy"
            />
            <p className="details">Accessible templates and documentation.</p>
          </div>

          <div className="point">
            <Image
              src={arrowIcon}
              alt="point-icon"
              width={40}
              height={40}
              loading="lazy"
            />
            <p className="details">
              Generate standard markup and creation of accessible content.
            </p>
          </div>

          <div className="point">
            <Image
              src={arrowIcon}
              alt="point-icon"
              width={40}
              height={40}
              loading="lazy"
            />
            <p className="details">
              Define ways of checking and correcting inaccessible content.
            </p>
          </div>
        </div>
      </div>

      {/* --------------------------right section------------------------------ */}
      <div className="right">
        <Image src={Compatibility} alt="img-backgorund" />
      </div>
    </div>
  );
}

export default CompatibilitySection;
