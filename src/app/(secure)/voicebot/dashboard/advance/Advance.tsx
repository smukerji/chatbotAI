import dynamic from "next/dynamic";
import "./design.scss";
import { Input, Slider, Switch } from 'antd';
import { Select, ConfigProvider } from 'antd';
import Image from "next/image";
import security from "../../../../../../public/voiceBot/SVG/security.svg";
import videoimg from "../../../../../../public/voiceBot/SVG/video.svg";
import microimg from "../../../../../../public/voiceBot/SVG/microphone-2.svg";
import { useState } from "react";


const { Option } = Select;
function Advance() {

  const [stepsCount, setStepsCount] = useState<number>(5);
  return (
    <div className="advance-container">
      <h3 className="title">
        Privacy
      </h3>
      <p className="description">
        We've pre-built functions for common use cases. You can enable them and configure them below.
      </p>
      <div className="privacy-container">
        <div className="privacy-container-item">
          <div className="first-container">
            <Image alt="security" src={security} width={100}></Image>
          </div>
          <div className="second-container">
            <div className="second-container-content">
              <h3 className="compliance-title">HIPAA Compliance</h3>
              <Switch className="hipaa-complaince-switch" defaultChecked />
            </div>
            <p className="description">
              When this is enabled, no logs, recordings, or transcriptions will be stored.
            </p>
          </div>


        </div>
        <hr className="splitter" />
        <div className="privacy-container-item">
          <div className="first-container">
            <Image alt="security" src={videoimg} width={100}></Image>
          </div>
          <div className="second-container">
            <div className="second-container-content">
              <h3 className="compliance-title">Video Recording</h3>
              <Switch className="hipaa-complaince-switch" defaultChecked />
            </div>
            <p className="description">
              When this is enabled, no logs, recordings, or transcriptions will be stored.
            </p>
          </div>

        </div>
        <hr className="splitter" />
        <div className="privacy-container-item">
          <div className="first-container">
            <Image alt="security" src={microimg} width={100}></Image>
          </div>
          <div className="second-container">
            <div className="second-container-content">
              <h3 className="compliance-title">Audio Recording</h3>
              <Switch className="hipaa-complaince-switch" defaultChecked />
            </div>
            <p className="description">
              When this is enabled, no logs, recordings, or transcriptions will be stored.
            </p>
          </div>

        </div>
      </div>

      <h3 className="title space-imp">
        Pipeline Configuration
      </h3>
      <p className="description">
        This section allows you to configure the pipeline settings for the assistant.
      </p>

      <div className="pipe-container">
        <div className="privacy-container-item">
          <div className="left-column">
            <div className="first-container">
              <Image alt="security" src={security} width={100}></Image>
            </div>
            <div className="second-container">
              <div className="second-container-content">
                <h3 className="compliance-title">HIPAA Compliance</h3>

              </div>
              <p className="description">
                When this is enabled, no logs, recordings, or transcriptions will be stored.
              </p>
            </div>
          </div>
          <div className="right-column">
            <div className="thrid-container-content">
              <Slider className="slider" min={2} max={10} value={stepsCount} onChange={setStepsCount} />
              <div className="point-notation">
                <span className="point-notation-value">10(sec)</span>
                <span className="point-notation-value">600(sec)</span>
              </div>
            </div>
            <div className="fourth-container-content">
              <h2 className="selectedValue">
                400
              </h2>
            </div>
          </div>
         
         


        </div>
        <hr className="splitter" />
        <div className="privacy-container-item">
          <div className="first-container">
            <Image alt="security" src={videoimg} width={100}></Image>
          </div>
          <div className="second-container">
            <div className="second-container-content">
              <h3 className="compliance-title">Video Recording</h3>
              <Switch className="hipaa-complaince-switch" defaultChecked />
            </div>
            <p className="description">
              When this is enabled, no logs, recordings, or transcriptions will be stored.
            </p>
          </div>

        </div>
        <hr className="splitter" />
        <div className="privacy-container-item">
          <div className="first-container">
            <Image alt="security" src={microimg} width={100}></Image>
          </div>
          <div className="second-container">
            <div className="second-container-content">
              <h3 className="compliance-title">Audio Recording</h3>
              <Switch className="hipaa-complaince-switch" defaultChecked />
            </div>
            <p className="description">
              When this is enabled, no logs, recordings, or transcriptions will be stored.
            </p>
          </div>

        </div>
      </div>


    </div>
  );
}

export default dynamic((): any => Promise.resolve(Advance), { ssr: false });