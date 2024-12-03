import React from 'react'
import Image from "next/image";
import activeImg from "../../../../../../public/voiceBot/SVG/Ellipse 64.svg"
import inActiveImg from "../../../../../../public/voiceBot/SVG/Ellipse 65.svg"
import { Input, Slider, Switch, Button, Select } from 'antd';
import PhoneInput from "react-phone-input-2";
import "./import-number-model.scss";
function ImportNumberCustomModel({ setOpen, title, content }: any) {
  return (
    <div className="phone-model-wrapper">
      <div className="backdrop" onClick={() => setOpen(false)}></div>
      <div className="model-content">
        <div className='header'>
          <h2 className='title'>Import phone number</h2>
        </div>
        <div className="middle">
          <div className='select-wrapper'>
            <h4 className='lable'>
              Twilio Phone Number
            </h4>

            <div className="phone-input-with-flag">
              <PhoneInput
                country={'us'}
                placeholder='Enter a phone number'
              />
            </div>
          </div>

          <div className='input-wrapper'>
            <h4 className="lable">Twilio Account SID</h4>
            <Input className="number-input"/>
          </div>

          <div className='input-wrapper'>
            <h4 className="lable">Twilio Auth Token</h4>
            <Input className="number-input"/>
          </div>

          <div className='input-wrapper'>
            <h4 className="lable">Label</h4>
            <Input className="number-input"/>
          </div>

        </div>       
        <div className="bottom">
          <Button className='cancel'> Cancel</Button>
          <Button className='import'> Import Form Twilio</Button>
        </div>
      </div>
    </div>
  )
}

export default ImportNumberCustomModel