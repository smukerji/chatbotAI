import dynamic from "next/dynamic";

function Model() {



  return (
    <div className="model-container">
      <div className="left-column">

      </div>  
      <div className="right-column">

      </div>
    </div>
  )
}

export default dynamic((): any => Promise.resolve(Model), { ssr: false });