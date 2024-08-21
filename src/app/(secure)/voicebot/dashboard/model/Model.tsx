import dynamic from "next/dynamic";
import "./model-design.scss";
import { Input } from 'antd';

function Model() {



  return (
    <div className="model-container">

      <div className="left-column">
        <h4 className="input-header">First Message</h4>
        <p className="input-description">The first message that the assistant will say.</p>
        <Input placeholder="Hi, Provide me the first message!" />
      </div>  
      <div className="right-column">
        <span>right</span>
      </div>
    </div>
  )
}

export default dynamic((): any => Promise.resolve(Model), { ssr: false });