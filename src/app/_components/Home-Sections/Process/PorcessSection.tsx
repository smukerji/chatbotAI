import React from "react";
import "./process-section.css";
import LeftFirstRectangle from "../../../../../public/sections-images/process-section/Rectangle 75.svg";
import LeftSecondRectangle from "../../../../../public/sections-images/process-section/Rectangle 78.svg";
import LeftThirdRectangle from "../../../../../public/sections-images/process-section/Rectangle 80.svg";
import LeftFourthRectangle from "../../../../../public/sections-images/process-section/Rectangle 82.svg";
import Image from "next/image";
function PorcessSection() {
  return (
    <div className="process-section-container">
      {/* ------------------------------top section------------------------------- */}
      <div className="top">
        <div className="process-text">
          PROCESS
          <div className="process-welcome-text">
            Our Service Process that we apply
          </div>
        </div>
        <button className="contact-demo-button">Contact for demo</button>
      </div>

      {/* ------------------------------bottom section------------------------------- */}
      <div className="bottom">
        {/* ------------------------------left first rectangle------------------------------- */}
        <div className="left-first-rectangle-container">
          <div className="left-first-rectangle-background"></div>
          <Image
            className="left-first-rectangle"
            src={LeftFirstRectangle}
            alt={"left-first-rectangle-image"}
          />
          <span className="left-first-rectangle-image-text">01</span>
          <div className="left-first-rectangle-title">DISCOVERY</div>
          <hr className="left-first-rectangle-title-underline" />
          <div className="left-first-rectangle-text">
            Our in-depth discovery phase, where we collaborate closely to
            understand your unique needs and objectives, ensuring a personalised
            approach.
          </div>
          <hr className="left-first-rectangle-first-line" />
          <hr className="left-first-rectangle-second-line" />
          <hr className="left-first-rectangle-third-line" />
        </div>

        {/* ------------------------------left second rectangle------------------------------- */}
        <div className="left-second-rectangle-container">
          <div className="left-second-rectangle-background"></div>
          <Image
            className="left-second-rectangle"
            src={LeftSecondRectangle}
            alt={"left-second-rectangle-image"}
          />
          <span className="left-second-rectangle-image-text">02</span>
          <div className="left-second-rectangle-title">Integration</div>
          <hr className="left-second-rectangle-title-underline" />
          <div className="left-second-rectangle-text">
            Effortlessly embed Lucifer.AI into your digital ecosystem as we
            create a seamless connection with your platforms, making it an
            integral part of your online presence.
          </div>

          <hr className="left-second-rectangle-first-line" />
          <hr className="left-second-rectangle-second-line" />
          <hr className="left-second-rectangle-third-line" />
        </div>

        {/* ------------------------------left third rectangle------------------------------- */}
        <div className="left-third-rectangle-container">
          <div className="left-third-rectangle-background"></div>
          <Image
            className="left-third-rectangle"
            src={LeftThirdRectangle}
            alt={"left-third-rectangle-image"}
          />
          <span className="left-third-rectangle-image-text">03</span>
          <div className="left-third-rectangle-title">Analysis</div>
          <hr className="left-third-rectangle-title-underline" />
          <div className="left-third-rectangle-text">
            Leverage our AI chatbot’s data-rich insights to gain a deep
            understanding of your audience and optimise interactions, driving
            measurable results
          </div>

          <hr className="left-third-rectangle-first-line" />
          <hr className="left-third-rectangle-second-line" />
          <hr className="left-third-rectangle-third-line" />
        </div>

        {/* ------------------------------left fourth rectangle------------------------------- */}
        <div className="left-fourth-rectangle-container">
          <div className="left-fourth-rectangle-background"></div>
          <Image
            className="left-fourth-rectangle"
            src={LeftFourthRectangle}
            alt={"left-fourth-rectangle-image"}
          />
          <span className="left-fourth-rectangle-image-text">04</span>
          <div className="left-fourth-rectangle-title">Results</div>
          <hr className="left-fourth-rectangle-title-underline" />
          <div className="left-fourth-rectangle-text">
            Watch engagement, satisfaction, and conversations soar as Lucifer.ai
            enhances user experiences, boosts efficiency, and delivers the
            exceptional outcomes you desire.
          </div>
        </div>
      </div>
    </div>
  );
}

export default PorcessSection;
