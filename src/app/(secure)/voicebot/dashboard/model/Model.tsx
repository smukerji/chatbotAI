import dynamic from "next/dynamic";
import "./model-design.scss";
import { Input, Slider, Switch } from 'antd';
import { Select, ConfigProvider } from 'antd';
import { CreateVoiceBotContext } from "../../../../_helpers/client/Context/VoiceBotContextApi"


import { useState, useContext, useEffect } from "react";


const { TextArea } = Input;

function Model() {

  const voiceBotContextData: any = useContext(CreateVoiceBotContext);
  // console.log("context data ", voiceBotContextData);
  const voicebotDetails = voiceBotContextData.state;

  const [stepsCount, setStepsCount] = useState<number>(5);
  const [firstMessage, setFirstMessage] = useState<string>("");
  const [systemPrompt, setSystemPrompt] = useState<string>("default");



  useEffect(() => {
    // Set the initial value from the context
    setFirstMessage(voicebotDetails.firstMessage || "");
    setSystemPrompt(voicebotDetails["model"]["messages"][0]["context"] || "");
  }, [voicebotDetails.firstMessage, voicebotDetails["model"]["messages"][0]["context"]]);

  // voiceBotContextData.updateState("provider", "11labs");

  const firstMessageEnterHandler = (e:React.ChangeEvent<HTMLInputElement>) => {
    console.log("first message ", e.target.value);
    const enteredValue: string = e.target.value;
    setFirstMessage(enteredValue);
    // voiceBotContextData.updateState("firstMessage", enteredValue);
    voiceBotContextData.updateTheVoiceBotInfo("firstMessage")(enteredValue);
    console.log("first message from the context after updated ",voicebotDetails);
  }

  const systemPromptEnterHandler = (e:React.ChangeEvent<HTMLTextAreaElement>) => {
    console.log("system prompt ", e.target.value);
    const enteredValue: string = e.target.value;
    setSystemPrompt(enteredValue);
    // voiceBotContextData.updateState("model.messages[0].context", enteredValue);
    voiceBotContextData.updateTheVoiceBotInfo("model.messages[0].context")(enteredValue);
    console.log("system prompt from the context after updated ",voicebotDetails);
  }

  console.log("your voicebot details ", voicebotDetails);
  
  const providersOption: {value: string; label: string; }[] = [
      {
        value: '1',
        label: 'openai',
      },
      {
        value: '2',
        label: 'together.ai',
      },
      {
        value: '3',
        label: 'anyscale',
      },
      {
        value: '4',
        label: 'openrouter',
      },
      {
        value: '5',
        label: 'perplexity-ai',
      },
      {
        value: '6',
        label: 'deepinfra',
      },
      {
        value: '7',
        label: 'groq',
      },
      {
        value: '8',
        label: 'anthropic',
      },
      {
        value: '9',
        label: 'custom-llm',
      },
    ]

  return (
    <div className="model-container">

      <div className="left-column">
        <h4 className="input-header">First Message</h4>
        <p className="input-description">The first message that the assistant will say.</p>
        <Input className="input-field" 
        placeholder="Hi, Provide me the first message!" 
        onChange={firstMessageEnterHandler}  
        value={firstMessage}/>

        <h4 className="input-header second">System Prompt</h4>
        <p className="input-description">The context allows you to customize your voicebot&lsquo;s personality, role and instructions. </p>
        <TextArea className="text-area"
         rows={4} 
         placeholder="Write your system prompts here..." 
          value={systemPrompt}
          onChange={systemPromptEnterHandler}
         />

      </div>

      <div className="right-column">
        <h4 className="provider">Provider</h4>
        <Select
          className="select-field"

          placeholder="Select the provider"

          options={providersOption}
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
          <Switch className="emotional-switch" defaultChecked />
        </div>

      </div>

    </div>
  )
}

export default dynamic((): any => Promise.resolve(Model), { ssr: false });