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

  const [stepsCount, setStepsCount] = useState<number>(0);
  const [firstMessage, setFirstMessage] = useState<string>("");
  const [systemPrompt, setSystemPrompt] = useState<string>("default");
  const [selectedProvider, setSelectedProvider] = useState<string | undefined>(undefined);
  const [models, setModels] = useState<{ value: string; label: string }[]>([]);
  const [selectedModel, setSelectedModel] = useState<string | undefined>(undefined);
  const [maxToken, setMaxToken] = useState<string>("");
  const [validationMessage, setValidationMessage] = useState<string>("");
  
  const [inputValidationMessage, setinputValidationMessage] = useState<string>("");
  const [systemPromptValidationMessage, setSystemPromptValidationMessage] = useState<string>("");
  const [providerValidationMessage, setProviderValidationMessage] = useState<string>("");
  const [modelValidationMessage, setModelValidationMessage] = useState<string>("");


  const [emotionRecognitionEnabled, setEmotionRecognitionEnabled] = useState<boolean>(false);


  useEffect(() => {
    // Set the initial value from the context
    setFirstMessage(voicebotDetails.firstMessage || "");
    setSystemPrompt(voicebotDetails["model"]["messages"][0]["content"] || "");
    setSelectedProvider(voicebotDetails["model"]["provider"] || undefined);
    setSelectedModel(voicebotDetails["model"]["model"] || undefined);

    setStepsCount(voicebotDetails["model"]["temperature"] || 0);
    setMaxToken(voicebotDetails["model"]["maxTokens"] || "");
    setEmotionRecognitionEnabled(voicebotDetails["model"]["emotionRecognitionEnabled"]);
    let check = voicebotDetails["model"]["emotionRecognitionEnabled"];
    let check2 = emotionRecognitionEnabled;
    debugger;

  },[ voicebotDetails.firstMessage, 
      voicebotDetails["model"]["messages"][0]["content"], 
      voicebotDetails["model"]["provider"],
    voicebotDetails["model"]["model"],
    voicebotDetails["model"]["temperature"],
    voicebotDetails["model"]["maxTokens"],
    voicebotDetails["model"]["emotionRecognitionEnabled"]
    ]);


  const firstMessageEnterHandler = (e:React.ChangeEvent<HTMLInputElement>) => {
    const enteredValue: string = e.target.value;
    // debugger;
    setFirstMessage(enteredValue);
    if (enteredValue.trim().length == 0) {
      setinputValidationMessage("Type the first message for the assistant");
      voiceBotContextData.updateTheVoiceBotInfo("firstMessage")("");
    } else {
      setinputValidationMessage("");
      voiceBotContextData.updateTheVoiceBotInfo("firstMessage")(enteredValue);
    }
  }

  const systemPromptEnterHandler = (e:React.ChangeEvent<HTMLTextAreaElement>) => {
    const enteredValue: string = e.target.value;
    setSystemPrompt(enteredValue);
    if (enteredValue.trim().length == 0) {
      setSystemPromptValidationMessage("Type and customize your voicebot’s personality, role and instructions.");
      voiceBotContextData.updateState("model.messages.0.content", "");
    } else {
      setSystemPromptValidationMessage("");
      voiceBotContextData.updateState("model.messages.0.content", enteredValue);
    }
  }

  const providerChangeHandler = (value: string,option:any) => {
    debugger;
    setSelectedProvider(option.label);
    setProviderValidationMessage(""); // Clear validation message on valid selection
    voiceBotContextData.updateState("model.provider", option.label);

    // Update models based on selected provider
    const selectedProvider = providersOption.find(provider => provider.label === option.label);
    if (selectedProvider) {
      setModels(selectedProvider.models.map(model => ({ value: model, label: model })));
    } else {
      setModels([]);
    }

    //reset the model value
    setSelectedModel(undefined);
    voiceBotContextData.updateState("model.model", undefined);
  }

  const handleProviderBlur = () => {
    if (!selectedProvider) {
      setProviderValidationMessage("Please select a provider");
    }
  }



  const modelChangeHandler = (value: string, option: any) => {

    setSelectedModel(option.label);
    setModelValidationMessage("");// Clear validation message on valid selection
    voiceBotContextData.updateState("model.model", option.label);
  }

  const handleModelBlur = () => {
    if (selectedProvider) {
      if (!selectedModel) {
        setModelValidationMessage("Please select a model");
      }
    }

   
  }

  const stepsCountChangeHandler = (value: number) => {
    setStepsCount(value);
    voiceBotContextData.updateState("model.temperature", value);
  }

  const maxTokenChangeHandler = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    debugger
    setMaxToken(value);
    const intValue = parseInt(value, 10);
    if (!isNaN(intValue) && intValue <= 1000) {
      setValidationMessage("");
      voiceBotContextData.updateState("model.maxTokens", intValue);
    } else {
      setValidationMessage("Value must be less than or equal to 1000");
      voiceBotContextData.updateState("model.maxTokens", 0);
    }
  }

  const emotionRecognitionChangeHandler = (checked: boolean) => {
    setEmotionRecognitionEnabled(checked);
    console.log("checked ", checked);

    voiceBotContextData.updateState("model.emotionRecognitionEnabled", checked);
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
      value: '2',
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
        <Input className={inputValidationMessage ? "input-field invalid-input" : "input-field"} 
        placeholder="Hi, Provide me the first message!" 
        onChange={firstMessageEnterHandler}  
          value={firstMessage} />

        {inputValidationMessage && <p className="invalidation-message">{inputValidationMessage}</p>}

        <h4 className="input-header second">System Prompt</h4>
        <p className="input-description">The context allows you to customize your voicebot&lsquo;s personality, role and instructions. </p>
        
        <TextArea className="text-area"
         rows={4} 
         placeholder="Write your system prompts here..." 
         value={systemPrompt}
         onChange={systemPromptEnterHandler}
         />
           {systemPromptValidationMessage && <p className="invalidation-message">{systemPromptValidationMessage}</p>}
      </div>

      <div className="right-column">
        <h4 className="provider">Provider</h4>
        <Select
          className={providerValidationMessage ? "select-field error-provider" : "select-field"}
          placeholder="Select the provider"
          onChange={providerChangeHandler}
          onBlur={handleProviderBlur}
          value={selectedProvider}
          options={providersOption}
        />
        {providerValidationMessage && <p className="invalidation-message">{providerValidationMessage}</p>}


        <h4 className="provider model">Model</h4>
        <Select
          className={modelValidationMessage ? "select-field error-model" : "select-field"}
          placeholder="Select the model"
          value={selectedModel}
          options={models}
          onChange={modelChangeHandler}
          onBlur={handleModelBlur}
        />
        {modelValidationMessage && <p className="invalidation-message">{modelValidationMessage}</p>}
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
          <h4 className="temprature_title">Temperatures</h4>
          <span className="temprature_value">{stepsCount}</span>
          {/* <Input className="temparature-input" value={stepsCount} onChange={stepsCountInputChangeHandler}/> */}
        </div>

        <Slider className="slider" step={0.1} min={0} max={2} value={stepsCount} onChange={stepsCountChangeHandler} />

        <h4 className="man-token">Max Token</h4>

        <Input
          className={validationMessage ? "max-token-input invalid-input" : "max-token-input"}
          placeholder="300"
          value={maxToken}
          onChange={maxTokenChangeHandler}
        />
        {validationMessage && <p className="invalidation-message">{validationMessage}</p>}


        <div className="temprature emotional-detect">
          <h4 className="emotional-header">Emotion Detects</h4>
          <Switch className="emotional-switch" value={emotionRecognitionEnabled} onChange={emotionRecognitionChangeHandler}/>
        </div>

      </div>

    </div>
  )
}

export default dynamic((): any => Promise.resolve(Model), { ssr: false });