import React from 'react';

import "./phone-number-design.scss";
import { Input, Slider, Switch, Button } from 'antd';

function PhoneNumber() {
  const contacts = [
    { id: 1, phone: '+84 (353) 085 867', email: 'tuan@sapakh.ai', toggle: true },
    { id: 2, phone: '+84 (353) 085 867', email: 'tuan@sapakh.ai', toggle: false },
    { id: 3, phone: '+84 (353) 085 867', email: 'tuan@sapakh.ai', toggle: false },
    { id: 4, phone: '+84 (353) 085 867', email: 'tuan@sapakh.ai', toggle: false },
    { id: 5, phone: '+84 (353) 085 867', email: 'tuan@sapakh.ai', toggle: false }
   
  ];

  return (
    <div className='phone-container'> 
      <div className='left-container'>
        <div className='list-items'>
          {

            contacts.map((contact,index) => (
              <>
               { index !== 0 && <hr className="splitter" />}
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
          <Button className="previous">Import Phone Number</Button>
        </div>
      </div>
      <div className='right-container'>
    right
      </div>
    </div>
  )
}

export default PhoneNumber