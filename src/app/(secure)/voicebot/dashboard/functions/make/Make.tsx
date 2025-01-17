import Image from "next/image";
import makeImage from "../../../../../../../public/voiceBot/make-com.png"
import { Input, Slider, Switch, Select } from 'antd';
import "./design.scss";
function Make() {
  return (
    <div className="make-container">
      <h4 className="title">Provider</h4>
      <div className="image-wrapper">
        <Image alt="make.com" src={makeImage}></Image>
        <p>Connect your Make.com Scenario as a tool which can be triggered during conversations.</p>
      </div>
      <div className="input-wrapper">
        <h4 className="lable">Max Token</h4>
        <Input className="server-url-input" placeholder="add your server url here" />
        
      </div>
    </div>
  )
}

export default Make