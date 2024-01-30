import Image from "next/image";
import discoveryIcon from "../../../../../public/sections-images/services-section/discovery-icon.svg";
import resultIcon from "../../../../../public/sections-images/services-section/result-icon.svg";
import integrationIcon from "../../../../../public/sections-images/services-section/integration-icon.svg";
import analysisIcon from "../../../../../public/sections-images/services-section/analysis-icon.svg";
import "./service-section.scss";

function ServiceSection() {
  return (
    <div className="service-section-container">
      {/* --------------------------top section------------------------------ */}
      <div className="top">
        <h1 className="title">Our service process that we apply</h1>
        <a
          style={{ color: "white", textDecoration: "none" }}
          href="#contact-us"
        >
          <button className="request-demo-btn">Book a Demo</button>
        </a>
      </div>

      {/* --------------------------bottom section------------------------------ */}
      <div className="bottom">
        {/* --------------------------Discovery------------------------------ */}
        <div className="service-container">
          <Image src={discoveryIcon} alt="discovery-icon" />
          <h3>Discovery</h3>
          <p>
            Our in-depth discovery phase, where we collaborate closely to
            understand your unique needs and objectives, ensuring a personalised
            approach.
          </p>
        </div>

        {/* --------------------------Intergration------------------------------ */}
        <div className="service-container">
          <Image src={integrationIcon} alt="intergration-icon" />
          <h3>Intergration</h3>
          <p>
            Our in-depth intergration phase, where we collaborate closely to
            understand your unique needs and objectives, ensuring a personalised
            approach.
          </p>
        </div>

        {/* --------------------------Analysis------------------------------ */}
        <div className="service-container">
          <Image src={analysisIcon} alt="analysis-icon" />
          <h3>Analysis</h3>
          <p>
            Our in-depth discovery phase, where we collaborate closely to
            understand your unique needs and objectives, ensuring a personalised
            approach.
          </p>
        </div>

        {/* --------------------------Results------------------------------ */}
        <div className="service-container">
          <Image src={resultIcon} alt="results-icon" />
          <h3>Results</h3>
          <p>
            Our in-depth discovery phase, where we collaborate closely to
            understand your unique needs and objectives, ensuring a personalised
            approach.
          </p>
        </div>
      </div>
    </div>
  );
}

export default ServiceSection;
