import React, { useState } from 'react';

import "./phone-number-design.scss";
import PhoneInput from "react-phone-input-2";
import { Input, Slider, Switch, Button, Select } from 'antd';
import ImportNumber from './import-number/ImportNumber';
import ImportNumberCustomModel from '../../_components/ImportNumberCustomModel/ImportNumberCustomModel';

function PhoneNumber() {
  const contacts = [
    { id: 1, phone: '+84 (353) 085 867', email: 'tuan@sapakh.ai', toggle: true },
    { id: 2, phone: '+84 (353) 085 867', email: 'tuan@sapakh.ai', toggle: false },
    { id: 3, phone: '+84 (353) 085 867', email: 'tuan@sapakh.ai', toggle: false },
    { id: 4, phone: '+84 (353) 085 867', email: 'tuan@sapakh.ai', toggle: false },
    { id: 5, phone: '+84 (353) 085 867', email: 'tuan@sapakh.ai', toggle: false }

  ];

  const [openModel, setOpenModel] = useState<boolean>(true);

  const openHandleModel = () => {
    setOpenModel(true);

  }

  return (
    <div className='phone-container'>
      <div className='left-container'>
        <div className='list-items'>
          {

            contacts.map((contact, index) => (
              <>
                {index !== 0 && <hr className="splitter" />}
                <div className='list-item'>
                  <div className='number-details'>
                    <h2> {contact.phone} </h2>
                    <p>  {contact.email} </p>
                  </div>
                  <div className='switch-input'>
                    <Switch className="switch-btn" defaultChecked />
                  </div>
                </div>
              </>



            ))
          }
        </div>
        <div className='bottom-button'>
          <Button className="previous" onClick={() => openHandleModel()}>Import Phone Number</Button>
        </div>
      </div>
      <div className='right-container'>
        <div className='top'>
          <div className="container">
            <h3 className="title">Inbound Settings</h3>
            <p className="description">You can assign an assistant to the Phone number so that whenever someone calls this phoneNumber the assistant will automatically be assigned to the call..</p>
            <div className="content-wrapper">
              <div className='input-wrapper'>
                <h4 className="lable">Inbound Phone Number</h4>
                <Input className="phone-number-input" disabled />
              </div>

              <div className='input-wrapper'>
                <h4 className="lable">Assistant</h4>
                <Select className="select-field"

                  placeholder="Select the assistant"


                  options={[
                    {
                      value: '1',
                      label: 'deepgram',
                    },
                    {
                      value: '2',
                      label: 'talkscriber',
                    },
                    {
                      value: '3',
                      label: 'gladia',
                    }
                  ]}
                />
              </div>

              <div className='select-wrapper'>
                <h4 className='lable'>
                  Fallback Destination
                </h4>
                <p className='description'>
                  Set a fallback destination for inbound calls when the assistant or squad is not available.
                </p>
                <div className="phone-input-with-flag">
                  <PhoneInput
                    country={'us'}
                  />
                </div>
              </div>


            </div>
          </div>

        </div>

        <div className="bottom">
          <div className="container">
            <h3 className="title">Outbound Form</h3>
            <p className="description">You can assign an outbound phone number , set up a fallback and set up a squad to be called if the assistant is not available.</p>
            <div className="content-wrapper">
             
              <div className='select-wrapper'>
                <h4 className='lable'>
                  Outbound Phone Number
                </h4>
               
                <div className="phone-input-with-flag">
                  <PhoneInput
                    country={'us'}
                    placeholder='Enter a phone number'
                  />
                </div>
              </div>

              <div className='input-wrapper'>
                <h4 className="lable">Assistant</h4>
                <Select className="select-field"

                  placeholder="Select the assistant"


                  options={[
                    {
                      value: '1',
                      label: 'deepgram',
                    },
                    {
                      value: '2',
                      label: 'talkscriber',
                    },
                    {
                      value: '3',
                      label: 'gladia',
                    }
                  ]}
                />
              </div>


            </div>
          </div>
        </div>
      </div>

      {
        openModel &&
        <ImportNumberCustomModel
          setOpen={setOpenModel}
          title={"Create a Tool"}
          content={<ImportNumber />} />
      }

    </div>
  )
}

export default PhoneNumber