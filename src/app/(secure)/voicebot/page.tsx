"use client";
import "./voicebot.scss"
import { Button, Input, Steps } from 'antd';
import editIcon from "../../../../public/svgs/edit-2.svg";
import Image from "next/image";

import img from "../../../../public/voiceBot/Image (4).png";
import infoImage from "../../../../public/voiceBot/SVG/info-circle.svg"
import customTemplate from "../../../../public/voiceBot/SVG/profile-circle.svg"
import galaryImg from "../../../../public/voiceBot/SVG/gallery-add.svg";
import leftArrow from "../../../../public/voiceBot/SVG/arrow-left.svg"
import { useRouter } from "next/navigation";

import { useState, useContext, useEffect } from "react";

// import { CreateVoiceBotContext } from "../../../../_helpers/client/Context/VoiceBotContextApi"/
import { CreateVoiceBotContext } from "../../_helpers/client/Context/VoiceBotContextApi";

export default function VoiceBot() {

  const voiceBotContextData: any = useContext(CreateVoiceBotContext);
  const voicebotDetails = voiceBotContextData.state;

  const router = useRouter();

  let cardDetails = [{
    image: "",
    title: "",
    subTitle:""
  }];

  const [currentPage, setCurrentPage] = useState<number>(1);
  const [selectedAssistant, setSelectedAssistant] = useState<any>(null);
  const [assistantList, setAssistantList] = useState<any>([]);
  const [industryExpertList, setIndustryExpertList] = useState<any>([]);
  const [selectedIndustryExpert, setSelectedIndustryExpert] = useState<any>(null);
  const [assistantName, setAssistantName] = useState<string>("");

  async function  getVoiceAssistantTemplateData() {
    try{

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_WEBSITE_URL}voicebot/dashboard/api/template`,
        {
          method: "GET",
        }
      );
      const data = await res.json();
      debugger;

      let assistantDataList = data?.assistantTemplates.filter((assistance:any)=> assistance?.industryType === "Assistant");
      let industryExpertDataList = data?.assistantTemplates.filter((assistance:any)=> assistance?.industryType === "Expert");
      setAssistantList(assistantDataList);
      setIndustryExpertList(industryExpertDataList);
      debugger;

    }
    catch(error: any) {
      console.log(error);
    }
  }

  useEffect(() => {
    getVoiceAssistantTemplateData();
  }, []);

  const assistantNameChangeHandler = (e:React.ChangeEvent<HTMLInputElement>) =>{


  }

  const continuesChangeHandler = ()=>{

    voiceBotContextData.setCurrentAssistantPage(1);

    // router.push("/voicebot/dashboard");
   
  }

  const previousChangeHandler = ()=>{

    voiceBotContextData.setCurrentAssistantPage(0);

    // router.push("/voicebot/dashboard");
   
  }

  
  

  return (
    <div className="parents-voicebot">
      {/*------------------------------------------stepper----------------------------------------------*/}
      <div className="stepper">
        <div className="voicebot-avatar">
          <div className="voicebot-avatar-img">
          <input
                  type="file"
                  id="profileImageId"
                  style={{ display: "none" }}
                  accept="image/*"
                  // onChange={imageHandler}
                />
          <label htmlFor="profileImageId" className="file-label">
            <Image alt="" src={galaryImg} className="galary_image"></Image>
          </label>
          </div>
            <div className="voicebot-avatar-img__info">
            <Input
              className={"assi-input-field"}
              placeholder="Your Assistant Name"
              onChange={assistantNameChangeHandler}
              id="assistantNameInput"
            />
            <Button style={{border:"none", margin:0, padding:0, background:"transparent"}}
              icon={<Image src={editIcon} alt="edit name" />}
              onClick={() => {
              const inputElement = document.getElementById("assistantNameInput") as HTMLInputElement;
              if (inputElement) {
                inputElement.focus();
              }
              }}
            />
            </div>
        </div>
        <h2>Create your voicebot</h2>
        <h3>Let&lsquo;s create your own bot</h3>
        <Steps className="stepper-steps"
          direction="vertical"
          size="small"
          current={1}
          items={[
            {
              title: <div className="selected-assistant">
                <div className="mini-selected-assistant-image">
                <input
                  type="file"
                  id="profileImageId"
                  style={{ display: "none" }}
                  accept="image/*"
                  // onChange={imageHandler}
                />
                <label htmlFor="profileImageId" className="file-label">
                  <Image alt="" src={img} width={100} height={100}></Image>
                </label>
                </div>
                <div className="selected-assistant-header">
                  <h3 className="heading_title">
                    Your assistant
                  </h3>
                  <h4 className="heading_description">
                    Customer Service Representative
                  </h4>
                </div>
              </div>,
              description: "" /*<div> gggg</div> */},
            {
              title: 'Choose your AI expert',
              description:"Description information! ",
            },
            {
              title: 'Done',
              description:"Test your voice bot",
            },
          ]}
        />

        <div className="navigation-button">
          {voiceBotContextData.currentAssistantPage !== 0 && (
            <Button className="previous-button" onClick={previousChangeHandler}>
              <Image className="arrow-left" alt="left arrow" src={leftArrow} width={100} height={100} />
              <span className="previous-button-text">Previous</span>
            </Button>
          )}
          <Button className="continue-button" type="primary" onClick={continuesChangeHandler} style={{ marginLeft: voiceBotContextData.currentAssistantPage === 0 ? 0 : 'auto' }}>
            Continue
          </Button>
        </div>
      

      </div>
      {/*------------------------------------------stepper-end----------------------------------------------*/}

      {/*------------------------------------------main-voicebot----------------------------------------------*/}
      <div className="main-voicebot">
        <h2 className="main-voiceboot__title">
          {
            voiceBotContextData.currentAssistantPage === 0 ? "Let's create a new assistant" : "Choose your industry expert"
          }
        </h2>
        <h4 className="main-voiceboot__subtitle">
          {
            voiceBotContextData.currentAssistantPage === 0 ? "Get started by selecting the AI assistant that best fits your needs and preferences." : "Choose your specialized AI expert for tasks like translation, diagnostics, finance, or customer service needs."
          }
        </h4>

        <div className="assistant-wrapper">
        <div className="custom_assistant-card">
            <div className="blank-template">
              <div className="image-card">
                <Image src={customTemplate} alt="" height={100} width={100}></Image>
              </div>
              <h3 className="card_sub-header">
                Blank Template
              </h3>
            </div>
          </div>
            {
            voiceBotContextData.currentAssistantPage === 0 ? (
              assistantList.map((assistant: any, index:number) => {
                return (
                <div className="assistant-card" key={index}>
                  <div className="card-image">
                  <Image src={assistant.imageUrl} alt="" height={100} width={100}></Image>
                  </div>
                  <div className="header-information">
                  <div className="header_container">
                    <h2 className="card_header">
                    {assistant.assistantType}
                    </h2>
                    <div className="image-info">
                    <Image src={infoImage} alt="" height={100} width={100}></Image>
                    </div>
                  </div>

                  <h3 className="card_sub-header">
                    {assistant.dispcrtion}
                  </h3>
                  </div>
                </div>
                );
              })
            ) 
            : 
            (
              industryExpertList.map((assistant: any, index:number) => {
                return (
                  <div className="assistant-card" key={index}>
                    <div className="card-image">
                    <Image src={assistant.imageUrl} alt="" height={100} width={100}></Image>
                    </div>
                    <div className="header-information">
                    <div className="header_container">
                      <h2 className="card_header">
                      {assistant.assistantType}
                      </h2>
                      <div className="image-info">
                      <Image src={infoImage} alt="" height={100} width={100}></Image>
                      </div>
                    </div>
  
                    <h3 className="card_sub-header">
                      {assistant.dispcrtion}
                    </h3>
                    </div>
                  </div>
                  );
              })
            )  
            
            }
          {/* <div className="assistant-card">
            <div className="card-image">
              <Image src={img} alt="" height={100} width={100}></Image>
            </div>
            <div className="header-information">
              <div className="header_container">
                <h2 className="card_header">
                  Sales Agent
                </h2>
                <div className="image-info">
                  <Image src={infoImage} alt="" height={100} width={100}></Image>
                </div>
              </div>

              <h3 className="card_sub-header">
                AI Chatbot Agent
              </h3>
            </div>

          </div> */}

          

        </div>
      </div>
      {/*------------------------------------------main-voicebot-end----------------------------------------------*/}

    </div>
  )
}