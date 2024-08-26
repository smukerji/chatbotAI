import dynamic from "next/dynamic";
import "./design.scss";
import { Input, Slider, Switch } from 'antd';
import { Select, ConfigProvider } from 'antd';
import Image from "next/image";
import keyboardimg from "../../../../../../public/voiceBot/SVG/keyboard.svg";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
const { Option } = Select;
function Functions() {

  const countryFlag: any = 
    [
      {
        value: '1',
        label: 'US',
      },
      {
        value: '2',
        label: 'UK',
      },
      {
        value: '3',
        label: 'IN',
      },
      {
        value: '4',
        label: 'AU',
      },
      {
        value: '5',
        label: 'CA',
      }
  ];

  const prefixSelector:any = (
    


    <Select
      style={{ width: 100 }}
      options={[
        {
          value: '1',
          label: '+21',
        },
        {
          value: '2',
          label: '+90',
        },
        {
          value: '3',
          label: '+91',
        },
        {
          value: '4',
          label: '+93',
        },
        {
          value: '5',
          label: '+44',
        },
        {
          value: '6',
          label: '+444',
        },
      ]}
    />
 
  );


  return (
    <div className="function-container">
      <div className="left-column">
        <h3 className="title">Tools</h3>
        <p className="description">Tools are a way you can enable your voicebots to perform certain actions and tasks during the call. Add your tools From the Tools Library page to your voicebots to connect with Make.com or GHL workflows. You can also have custom tools with your own backend.</p>
        <div className="wrapper">
          <h4 className="provider">Provider</h4>
          <Select className="select-field"

            placeholder="Select the provider"


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

        <h3 className="title">Custom functions</h3>
        <p className="description">Define your custom functions here to enhance your assistant's capabilities. You can use your own code or tools like Pipedream or Make for the setup.</p>
        <div className="wrapper">
          <h4 className="provider">Provider</h4>
          <Select className="select-field"

            placeholder="Select the provider"


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
      <div className="right-column">
        <h3 className="title">Predefined Functions</h3>
        <p className="description">We've pre-built functions for common use cases. You can enable them and configure them below.</p>
        <div className="wrapper">
          <h4 className="provider">Call Function</h4>
          <Select className="select-field"

            placeholder="Select the provider"


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

          <div className="emotional-detect">
            <h4 className="emotional-header">Enable End Call Function</h4>
            <Switch className="emotional-switch" defaultChecked />
          </div>
          <p className="info">This will allow the assistant to end the call from its side. (Best for gpt-4 and bigger models.) Read More</p>
          
          <div className="dial-wrapper">
            <div className="icon">
              <Image alt="keyboard" src={keyboardimg}></Image>
            </div>

            <div className="toggle">
              <div className="emotional-detect split">
                <h4 className="emotional-header">Dial Keypad</h4>
                <Switch className="emotional-switch" defaultChecked />
              </div>
              <p className="info">
                This sets whether the assistant can dial digits on the keypad
              </p>
              <a href="" className="read-more">Read More</a>
            </div>
          </div>

          <div className="emotional-detect split">
            <h4 className="emotional-header">Forwarding Phone Number</h4>
            <Switch className="emotional-switch" defaultChecked />
          </div>

          {/* <Input addonBefore={prefixSelector} style={{ width: '100%' }} />
           */}
          
          <div className="phone-input-with-flag">
            <PhoneInput 
            country={'us'}
              // value={this.state.phone}
              // onChange={phone => this.setState({ phone })}
            />
          </div>

          <h4 className="call-end-phrase">End Call Phrases</h4>

          <Input className="max-token-input" placeholder="Goodbye" />
         

        </div>
      </div>

    </div>
  )
}

export default dynamic((): any => Promise.resolve(Functions), { ssr: false });