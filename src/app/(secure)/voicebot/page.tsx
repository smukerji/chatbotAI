"use client";
import "./voicebot.scss"
import { Button, Steps } from 'antd';
import editIcon from "../../../../public/svgs/edit-2.svg";
import Image from "next/image";

import img from "../../../../public/voiceBot/Image (4).png";
import infoImage from "../../../../public/voiceBot/SVG/info-circle.svg"
import customTemplate from "../../../../public/voiceBot/SVG/profile-circle.svg"
import galaryImg from "../../../../public/voiceBot/SVG/gallery-add.svg";
import leftArrow from "../../../../public/voiceBot/SVG/arrow-left.svg"
import { useRouter } from "next/navigation";



export default function VoiceBot() {

  const router = useRouter();

  let cardDetails = [{
    image: "",
    title: "",
    subTitle:""
  }]
  return (
    <div className="parents-voicebot">
      {/*------------------------------------------stepper----------------------------------------------*/}
      <div className="stepper">
        <div className="voicebot-avatar">
          <div className="voicebot-avatar-img">
            <Image alt="" src={galaryImg} className="galary_image"></Image>
          </div>
          <div className="voicebot-avatar-img__info">
            <h4 className="voicebot-avatar-img__botname">Your Bot Name</h4>
            <Image className="voicebot-avatar-img__botimg" src={editIcon} alt="edit name" />
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
                  <Image alt="" src={img} width={100} height={100}></Image>
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
          <Button className="previous-button">
            <Image className="arrow-left" alt="left arrow" src={leftArrow} width={100} height={100}>

            </Image>
            <span className="previous-button-text">
              Previous
            </span>
          </Button>

          <Button type="primary" onClick={() => {
            router.push("/voicebot/dashboard");
          }}>Continue</Button>
        </div>
      

      </div>
      {/*------------------------------------------stepper-end----------------------------------------------*/}

      {/*------------------------------------------main-voicebot----------------------------------------------*/}
      <div className="main-voicebot">
        <h2 className="main-voiceboot__title">
          Let’s create a new assistant
        </h2>
        <h4 className="main-voiceboot__subtitle">
          Get started by selecting the AI assistant that best fits your needs and preferences.
        </h4>

        <div className="assistant-wrapper">
          {
            Array(4).fill("").map((x: any) => {
              return <>
                <div className="assistant-card">
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

                </div>
              </>
            })
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

        </div>
      </div>
      {/*------------------------------------------main-voicebot-end----------------------------------------------*/}

    </div>
  )
}