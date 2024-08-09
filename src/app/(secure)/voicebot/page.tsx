"use client";
import "./voicebot.scss"
import { Button, Steps } from 'antd';
import editIcon from "../../../../public/svgs/edit-2.svg";
import Image from "next/image";

import img from "../../../../public/voiceBot/Image (4).png";

export default function VoiceBot() {

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
              <img src="" alt="" />
          </div>
          <div className="voicebot-avatar-img__info">
            <h4 className="voicebot-avatar-img__botname">Your Bot Name</h4>
            <Image className="voicebot-avatar-img__botimg" src={editIcon} alt="edit name" />
          </div>
        </div>
        <h2>Create your voicebot</h2>
        <h3>Let's create your own bot</h3>
        <Steps
          direction="vertical"
          size="small"
          current={1}
          items={[
            {
              title: 'Choose your assistant',
              description: <div> gggg</div> },
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

        <Button type="primary">primary</Button>

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

          <div className="assistant-card">
            <div className="card-image">
              <Image src={img} alt="" height={100} width={100}></Image>
            </div>
          </div>

        </div>
      </div>
      {/*------------------------------------------main-voicebot-end----------------------------------------------*/}

    </div>
  )
}