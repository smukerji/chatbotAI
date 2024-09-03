import Image from "next/image";
import makeImage from "../../../../../../../public/voiceBot/make-com.png"
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
        
      </div>

    </div>
  )
}

export default Make