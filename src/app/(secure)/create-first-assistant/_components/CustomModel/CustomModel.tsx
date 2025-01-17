import "./custom-model.scss";
import Image from "next/image";
import activeImg from "../../../../../../public/voiceBot/SVG/Ellipse 64.svg"
import inActiveImg from "../../../../../../public/voiceBot/SVG/Ellipse 65.svg"
import { Input, Slider, Switch, Button, Select } from 'antd';
import { useState, useContext, useEffect } from "react";
import Schema from "../../../voicebot/dashboard/functions/schema/Schema";
import ToolFor from "../../../voicebot/dashboard/functions/tool-for/ToolFor";
import Make from "../../../voicebot/dashboard/functions/make/Make";


//define enum for MAKE, SCHEMA, TOOLFOR
enum Step {
  MAKE,
  SCHEMA,
  TOOLFOR
}

function CustomModel({ setOpen, title, content, componentTitle, componentDescription }: any) {

  const [currentRoute, setCurrentRoute] = useState<Step>(Step.MAKE);
  const [componentAvailbleTitle, setTitle] = useState<any>(componentTitle);
  const [componentAvailableDescription,setDescription] = useState<any>(componentDescription);
  const [componentContent, setComponentContent] = useState<any>(content);
  const [firstImage, setFirstImage] = useState<any>(activeImg);
  const [secondImage, setSecondImage] = useState<any>(inActiveImg);
  const [thirdImage, setThirdImage] = useState<any>(inActiveImg);
  
  const stepChangedHandler = () => {
    if(currentRoute === Step.MAKE){
      setCurrentRoute(Step.SCHEMA);
      setComponentContent(<Schema />);
      setFirstImage(inActiveImg);
      setSecondImage(activeImg);
      setThirdImage(inActiveImg);

    } else if(currentRoute === Step.SCHEMA){
      setCurrentRoute(Step.TOOLFOR);
      setComponentContent(<ToolFor />);
      setSecondImage(inActiveImg);
      setThirdImage(activeImg);

    } else if(currentRoute === Step.TOOLFOR){
      setOpen(false);
    }
  }

  const stepBackHandler = () => {
    if (currentRoute === Step.TOOLFOR) {
      setCurrentRoute(Step.SCHEMA);
      setComponentContent(<Schema />);
      setSecondImage(activeImg);
      setThirdImage(inActiveImg);
    } else if (currentRoute === Step.SCHEMA) {
      setCurrentRoute(Step.MAKE);
      setComponentContent(<Make />);
      setFirstImage(activeImg);
      setSecondImage(inActiveImg);
    }
  };

  // useEffect(() => {
  //   setComponentContent(content);
  // }, [content])
  

  
  return (
    <div className="model-wrapper">
      <div className="backdrop" onClick={() => setOpen(false)}></div>
      <div className="model-content">
        <div className="header">
          <h2>{title}</h2>
          <div className="steps">
            <Image alt="current-status" src={firstImage}></Image>
            <Image alt="current-status" src={secondImage}></Image>
            <Image alt="current-status" src={thirdImage}></Image>
          </div>
          <h3 className="model-title">{componentAvailbleTitle}</h3>
          <p className="model-description">{componentAvailableDescription}</p>
        </div>
        {/* <Select
          placeholder="Select a person"
          
          options={[
            { value: '1', label: 'Jack' },
            { value: '2', label: 'Lucy' },
            { value: '3', label: 'Tom' },
          ]}
        /> */}
       
        <div className="content">{componentContent}</div>
        <div className="footer">
          <div className="left-column">
            <Button onClick={()=>{
              setOpen(false);
            }}>Cancel</Button>
          </div>
          <div className="right-column">
            <Button className={currentRoute === Step.MAKE ? "previous block-previous" : "previous"} onClick={stepBackHandler}>Previous</Button>
            <Button className="next" onClick={stepChangedHandler}>{currentRoute === Step.TOOLFOR ? "Create" : "Next"}</Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CustomModel