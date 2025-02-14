import React, { useState } from 'react';
import Image from "next/image";
import activeImg from "../../../../../../public/voiceBot/SVG/Ellipse 64.svg";
import inActiveImg from "../../../../../../public/voiceBot/SVG/Ellipse 65.svg";
import { Input, Button, message } from 'antd';
import PhoneInput from "react-phone-input-2";
import "./import-number-model.scss";
import { useCookies } from "react-cookie";


function ImportNumberCustomModel({ setOpen, title, content, onClose}: any) {
  
  const [cookies, setCookie] = useCookies(["userId"]);
  const [formData, setFormData] = useState({
    phoneNumber: "",
    accountSid: '',
    authToken: '',
    label: '',
    userId:cookies.userId
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handlePhoneNumberChange = (value: string) => {
    setFormData(prevState => ({
      ...prevState,
      phoneNumber: value
    }));
  };

  const handleSubmit = async () => {
    console.log('formData:', formData);
    //  `${process.env.NEXT_PUBLIC_WEBSITE_URL}voicebot/dashboard/api/phone`,

    try{

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_WEBSITE_URL}voicebot/dashboard/api/phone`,
        {
          method: "POST",
          body: JSON.stringify({ ...formData }),
          next: { revalidate: 0 },
        }
      );
  
      const data = await response.json();
      console.log('twilio response Data:', data);
      message.info(data.message);
      setOpen(false);
      onClose();
    }
    catch(error:any){
      console.error('Error parsing request body:', error);
      message.error('Error parsing request body:', error);
    }
   
    
   
  };

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
                value={formData.phoneNumber}
                onChange={handlePhoneNumberChange}
              />
            </div>
          </div>

          <div className='input-wrapper'>
            <h4 className="lable">Twilio Account SID</h4>
            <Input
              className="number-input"
              name="accountSid"
              value={formData.accountSid}
              onChange={handleInputChange}
            />
          </div>

          <div className='input-wrapper'>
            <h4 className="lable">Twilio Auth Token</h4>
            <Input
              className="number-input"
              name="authToken"
              value={formData.authToken}
              onChange={handleInputChange}
            />
          </div>

          <div className='input-wrapper'>
            <h4 className="lable">Label</h4>
            <Input
              className="number-input"
              name="label"
              value={formData.label}
              onChange={handleInputChange}
            />
          </div>
        </div>
        <div className="bottom">
          <Button className='cancel' onClick={() => setOpen(false)}> Cancel</Button>
          <Button className='import' onClick={handleSubmit}> Import From Twilio</Button>
        </div>
      </div>
    </div>
  );
}

export default ImportNumberCustomModel;