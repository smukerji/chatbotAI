import dynamic from "next/dynamic";
import "./model-design.scss";
import { Input, Slider, Switch } from 'antd';
import { Select, ConfigProvider } from 'antd';

import { useState } from "react";


const { TextArea } = Input;

function Model() {

  const [stepsCount, setStepsCount] = useState<number>(5);

  return (
    <div className="model-container">
    
      <div className="left-column">
        <h4 className="input-header">First Message</h4>
        <p className="input-description">The first message that the assistant will say.</p>
        <Input className="input-field" placeholder="Hi, Provide me the first message!" />

        <h4 className="input-header second">First Message</h4>
        <p className="input-description">The first message that the assistant will say.</p>
        <TextArea className="text-area" rows={4} placeholder="Write your system prompts here..." />

      </div>

      <div className="right-column">
        <h4 className="provider">Provider</h4>
        <Select
          className="select-field"

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

        <h4 className="provider model">Model</h4>
        <Select
          className="select-field"

          placeholder="Select the model"


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
        <p className="model-info">GPT-4 is more accurate but slower and costlier than GPT-3.5 Turbo (1 min = 1 credit for GPT-3.5 Turbo, 20 credits for GPT-4).</p>

        <h4 className="provider knowledge-base">Knowledge Base</h4>
        <Select
          className="select-field"

          placeholder="Select the model"


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

        <div className="temprature model">
          <h4 className="temprature_title">Knowledge Base</h4>

          <span className="temprature_value">0.5</span>
        </div>
        
        <Slider className="slider" min={2} max={10} value={stepsCount} onChange={setStepsCount} />

        <h4 className="man-token">Max Token</h4>

        <Input className="max-token-input" placeholder="300" />

        <div className="temprature emotional-detect">
          <h4 className="emotional-header">Emotion Detects</h4>
          <Switch className="emotional-switch" defaultChecked  />
        </div>

      </div>

    </div>
  )
}

export default dynamic((): any => Promise.resolve(Model), { ssr: false });