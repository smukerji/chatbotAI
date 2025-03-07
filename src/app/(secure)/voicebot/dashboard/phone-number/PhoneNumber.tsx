import React, { useEffect, useState } from 'react';

import "./phone-number-design.scss";
import PhoneInput from "react-phone-input-2";
import { Input, Slider, Switch, Button, Select ,  Flex, Spin, message} from 'antd';
import Image from "next/image";
import ImportNumber from './import-number/ImportNumber';
import phoneNumberDelete from  "../../../../../../public/voiceBot/phone-number/trash.svg";

import { useCookies } from "react-cookie";
import ImportNumberCustomModel from '../../../create-first-assistant/_components/ImportNumberCustomModel/ImportNumberCustomModel';
interface TwilioDetails {
  createdAt: string;
  id: string;
  number: string;
  orgId: string;
  provider: string;
  twilioAccountSid: string;
  twilioAuthToken: string;
  updatedAt: string;
}

interface InboundNumberDetails {
  label: string;
  twilio: TwilioDetails;
  userId: string;
  _id: string;
  assistantId: string;
}
function PhoneNumber() {
  const contacts = [
    { id: 1, phone: '+84 (353) 085 867', email: 'tuan@sapakh.ai', toggle: true },
    { id: 2, phone: '+84 (353) 085 867', email: 'tuan@sapakh.ai', toggle: false },
    { id: 3, phone: '+84 (353) 085 867', email: 'tuan@sapakh.ai', toggle: false },
    { id: 4, phone: '+84 (353) 085 867', email: 'tuan@sapakh.ai', toggle: false },
    { id: 5, phone: '+84 (353) 085 867', email: 'tuan@sapakh.ai', toggle: false }

  ];
  // let phoneNumber:any = [];

  const [phoneNumbers, setPhoneNumbers] = useState([]);
  const [publishAssistantList, setPublishAssistantList] = useState([{ value: '', label: '' ,assistantId:''}]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [inboundNumberDetails, setInboundNumberDetails] = useState<InboundNumberDetails | null>(null);
  const [fallbackDestinationNumber, setFallbackDestination] = useState<string>('');

  const [cookies, setCookie] = useCookies(["userId"]);

  const [openModel, setOpenModel] = useState<boolean>(false);

  const openHandleModel = () => {
    setOpenModel(true);

  }

  async function getPublishAssistantDataFromDB() {

    try {
      const assistantListFromDb: any = await fetch(
        `${process.env.NEXT_PUBLIC_WEBSITE_URL}voicebot/dashboard/api/phone/vapi-connect-assistant?userId=${cookies?.userId}`,
        {
          method: "GET",
          next: { revalidate: 0 },
        }
      );
      const assistantResult = await assistantListFromDb.json();
      const assistantDataMap = assistantResult?.assistants.map((assistant: any) => {
        return {
          value: assistant.assistantName,
          label: assistant.assistantName,
          assistantId: assistant.vapiAssistantId
        }
      });
      setPublishAssistantList(assistantDataMap);

      console.log('assistant list:', assistantResult);
    }
    catch (error: any) {
      console.error('Error parsing request body:', error);
    }
  }

  async function getImportedTwilioDataFromDB() {

    try {
      setIsLoading(true);

      const phoneNumberData: any = await fetch(
        `${process.env.NEXT_PUBLIC_WEBSITE_URL}voicebot/dashboard/api/phone?userId=${cookies?.userId}`,
        {
          method: "GET",
          next: { revalidate: 0 },
        }
      );
      const twilioNumbers = await phoneNumberData.json();
      setPhoneNumbers(twilioNumbers?.importedNumbers);
      debugger
      setInboundNumberDetails(twilioNumbers?.importedNumbers[0]);
      setFallbackDestination(twilioNumbers?.importedNumbers[0]?.fallbackNumber?.number);
      console.log('twilioNumbers:', twilioNumbers);
    }
    catch (error: any) {
      console.error('Error parsing request body:', error);
    }
    setIsLoading(false);

  }

  useEffect(() => {

    const fetchData = async () => {
      await getPublishAssistantDataFromDB();
      await getImportedTwilioDataFromDB();
     
    }
    fetchData();

  }, []);

  function changedTheInboundNumberHandler(contact:any){
    debugger;
    setInboundNumberDetails(contact);
    setFallbackDestination(contact?.fallbackNumber?.number);
  }

  async function  assistantSelectOnPhoneNumberHandler(option:any,values:any){
    console.clear();
    console.log('selected option:', option);
    console.log('selected values:', values);
    if (inboundNumberDetails) {
      const updateValue = {
        twilioId: inboundNumberDetails.twilio.id,
        assistantId: values?.assistantId
      }

      debugger;
      const updatedRequest:any = await fetch(
        `${process.env.NEXT_PUBLIC_WEBSITE_URL}voicebot/dashboard/api/phone?userId=${cookies?.userId}`,
        {
          method: "PUT",
          body: JSON.stringify({ ...updateValue }),
          next: { revalidate: 0 },
        }
      );

      const updatedData = await updatedRequest.json();

      message.success(updatedData.message);

      console.log("updateValue", updateValue);
    }
  }

  const updateFallbackDestinationInputHandler = (value:string)=>{
    console.clear();
    console.log("fallback input hndler printing the value ",value);
    setFallbackDestination(value);
  }

  async function  fallbackDestinationNumberUpdateHandler(){
    console.clear();

    debugger;
    if (inboundNumberDetails) {
      const updateValue = {
        twilioId: inboundNumberDetails.twilio.id,
        fallbackDestination: {
          type: "number",
          number: "+".concat(fallbackDestinationNumber)
        }
      }

      debugger;
      const updatedRequest:any = await fetch(
        `${process.env.NEXT_PUBLIC_WEBSITE_URL}voicebot/dashboard/api/phone/fallback`,
        {
          method: "PUT",
          body: JSON.stringify({ ...updateValue }),
          next: { revalidate: 0 },
        }
      );

      const updatedData = await updatedRequest.json();

      message.success(updatedData.message);

      console.log("updateValue", updateValue);
    }
  }

  async function deletePhoneNumberHandler() {
      console.clear();
      console.log("Phone number details ", inboundNumberDetails);
  
      if (!inboundNumberDetails || !inboundNumberDetails?._id) {
          console.error("No phone number selected or missing ID");
          return;
      }
  
      try {
          const response = await fetch(
              `${process.env.NEXT_PUBLIC_WEBSITE_URL}voicebot/dashboard/api/phone?phoneNumberId=${inboundNumberDetails._id}`,
              {
                  method: "DELETE",
                  next: { revalidate: 0 },
              }
          );
  
          const data = await response.json();
          console.log('Delete response:', data.data);
          await getImportedTwilioDataFromDB();
          await getPublishAssistantDataFromDB();
  
      } catch (error: any) {
          console.error('Error deleting phone number:', error);
      }
  }

  return (
    <>
   {   isLoading ? (
          <Flex align="center" gap="middle" className="loader">
            <Spin size="large" />
          </Flex>
        ) :

        <div className='phone-container'>
        <div className='left-container'>
          <div className='list-items'>
            {
            phoneNumbers.length > 0 ? 
            phoneNumbers.map((contact:any, index:number) => (
                <>
                  {index !== 0 && <hr className="splitter" />}
                  <div className='list-item' onClick={changedTheInboundNumberHandler.bind(null,contact)}>
                    <div className='number-details'>
                      <h2> {contact.twilio.number} </h2>
                      <p>  {contact.label} </p>
                    </div>
                    {/* <div className='switch-input'>
                      <Switch className="switch-btn" defaultChecked />
                    </div> */}
                  </div>
                </>

              ))
              :
              <>
              <div className='list-item'>
                    <div className='number-details'>
                      <h2> No Number Added, Yet!</h2>
                      <p> Add new number here.</p>
                    </div>
                    
                  </div>
              </>
            }
          </div>
          <div className='bottom-button'>
            <Button className="previous" onClick={() => openHandleModel()}>Import Phone Number</Button>
          </div>
        </div>
        <div className='right-container'>
          <div className='top'>
            <div className="container">
                <div className='container-head-sec'>
                  <h3 className="title">Inbound Settings</h3>
                  {/* <Button className="previous" onClick={() => openHandleModel()}>Import Phone Number</Button> */}
                  <Button onClick={deletePhoneNumberHandler} className="edit-btn">
                    <Image src={phoneNumberDelete} alt='delete-number'></Image>
                    </Button>
                </div>
              <p className="description">You can assign an assistant to the Phone number so that whenever someone calls this phoneNumber the assistant will automatically be assigned to the call..</p>
              <div className="content-wrapper">
                <div className='input-wrapper'>
                  <h4 className="lable">Inbound Phone Number</h4>
                  <Input className="phone-number-input" 
                  value={inboundNumberDetails?.twilio.number} 
                  disabled />
                </div>

                <div className='input-wrapper'>
                  <h4 className="lable">Assistant</h4>
                  <Select className="select-field"

                    placeholder="Select the assistant"

                    onSelect={assistantSelectOnPhoneNumberHandler}
                    value={publishAssistantList.find((item) => item.assistantId === inboundNumberDetails?.assistantId)?.label}
                    options={publishAssistantList}
                  />
                </div>

                <div className='select-wrapper'>
                  <h4 className='lable'>
                    Fallback Destination
                  </h4>
                  <p className='description'>
                    Set a fallback destination for inbound calls when the assistant or squad is not available.
                  </p>
                  <div className="phone-input-with-flag" style={{position: 'relative'}} >
                    <PhoneInput
                      country={'us'}
                      onChange={updateFallbackDestinationInputHandler}
                      value={fallbackDestinationNumber}
                    />
                    <div style={{position: 'absolute', right: '0', top: '50%', transform: 'translateY(-50%)', height: '100%'}}>
                      <Button onClick={fallbackDestinationNumberUpdateHandler} className="add-btn" type="primary" ghost style={{display:'flex', justifyContent:'center', alignItems:'center', height:'100%'}}>Add</Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* <div className="bottom">
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
                    options={publishAssistantList}
                  />
                </div>


              </div>
            </div>
          </div> */}
        </div>

        {
          openModel &&
          <ImportNumberCustomModel
            setOpen={setOpenModel}
            title={"Create a Tool"}
            content={<ImportNumber />} 
            onClose={getImportedTwilioDataFromDB}
            />
        }

      </div>}
    </>
 
  )
}

export default PhoneNumber