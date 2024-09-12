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
  const [selectedProvider, setSelectedProvider] = useState<string | undefined>(undefined);
  const [models, setModels] = useState<{ value: string; label: string }[]>([]);
  const [selectedModel, setSelectedModel] = useState<string | undefined>(undefined);



  useEffect(() => {
    // Set the initial value from the context
    setFirstMessage(voicebotDetails.firstMessage || "");
    setSystemPrompt(voicebotDetails["model"]["messages"][0]["content"] || "");
    setSelectedProvider(voicebotDetails["model"]["provider"] || undefined);

  }, [voicebotDetails.firstMessage, voicebotDetails["model"]["messages"][0]["content"], voicebotDetails["model"]["provider"]]);

  // voiceBotContextData.updateState("provider", "11labs");

  const firstMessageEnterHandler = (e:React.ChangeEvent<HTMLInputElement>) => {
    const enteredValue: string = e.target.value;
    setFirstMessage(enteredValue);
    voiceBotContextData.updateTheVoiceBotInfo("firstMessage")(enteredValue);
  }

  const systemPromptEnterHandler = (e:React.ChangeEvent<HTMLTextAreaElement>) => {
    const enteredValue: string = e.target.value;
    setSystemPrompt(enteredValue);
    voiceBotContextData.updateState("model.messages.0.content", enteredValue);
  }

  const providerChangeHandler = (value: string,option:any) => {
    debugger;
    setSelectedProvider(option.label);
    voiceBotContextData.updateState("model.provider", option.label);
    // console.log("Selected provider:", value," option ", option);

    // Update models based on selected provider
    const selectedProvider = providersOption.find(provider => provider.label === option.label);
    if (selectedProvider) {
      setModels(selectedProvider.models.map(model => ({ value: model, label: model })));
    } else {
      setModels([]);
    }
  }

  console.log("your voicebot details ", voicebotDetails);
  
  const providersOption: {value: string; label: string; models:string[]}[] = [
    {
      value: '1',
      label: 'openai',
      models: [
        "GPT 40 Cluster",
        "GPT 40 Mini Cluster",
        "GPT 3.5 Turbo Cluster",
        "GPT 4 Turbo Cluster"
      ]
    },
    {
      value: '8',
      label: 'anthropic',
      models: [
        "claude-3-opus-20240229",
        "claude-3-sonnet-20240229",
        "claude-3-haiku-20240307",
        "claude-3-5-sonnet-20240620"
      ]
    }

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
          onChange={providerChangeHandler}
          value={selectedProvider}
          options={providersOption}
        />

        <h4 className="provider model">Model</h4>
        <Select
          className="select-field"
          placeholder="Select the model"
          value={selectedModel}
          options={models}
        />
        <p className="model-info">GPT-4o is more accurate but fast and cheaper</p>

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