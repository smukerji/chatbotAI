import "./custom-model.scss";
import Image from "next/image";
import activeImg from "../../../../../../public/voiceBot/SVG/Ellipse 64.svg"
import inActiveImg from "../../../../../../public/voiceBot/SVG/Ellipse 65.svg"
import { Input, Slider, Switch, Button, Select } from 'antd';
function CustomModel({ setOpen,title,content }: any) {
  
  return (
    <div className="model-wrapper">
      <div className="backdrop" onClick={() => setOpen(false)}></div>
      <div className="model-content">
        <div className="header">
          <h2>{title}</h2>
          <div className="steps">
            <Image alt="current-status" src={activeImg}></Image>
            <Image alt="current-status" src={inActiveImg}></Image>
            <Image alt="current-status" src={inActiveImg}></Image>
          </div>
          <h3 className="model-title">model-title</h3>
          <p className="model-description">model-description</p>
        </div>
        {/* <Select
          placeholder="Select a person"
          
          options={[
            { value: '1', label: 'Jack' },
            { value: '2', label: 'Lucy' },
            { value: '3', label: 'Tom' },
          ]}
        /> */}
       
        <div className="content">{content}</div>
        <div className="footer">
          <div className="left-column">
            <Button>Cancel</Button>
          </div>
          <div className="right-column">
            <Button className="previous">Previous</Button>
            <Button className="next">Next</Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CustomModel