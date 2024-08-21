import dynamic from "next/dynamic";
import "./model-design.scss";

function Model() {



  return (
    <div className="model-container">
      <div className="left-column">
        <span>left</span>
      </div>  
      <div className="right-column">
        <span>right</span>
      </div>
    </div>
  )
}

export default dynamic((): any => Promise.resolve(Model), { ssr: false });