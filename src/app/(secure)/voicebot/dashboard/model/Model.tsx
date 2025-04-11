import dynamic from "next/dynamic";
import "./model-design.scss";
import { Input, Slider, Switch } from 'antd';
import { Select, ConfigProvider } from 'antd';
import { CreateVoiceBotContext } from "../../../../_helpers/client/Context/VoiceBotContextApi"
import { useState, useContext, useEffect } from "react";
import { useCookies } from "react-cookie";


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

  const [cookies, setCookie] = useCookies(["userId"]);
  const [userFiles, setUserFiles] = useState<{ value: string; label: string }[]>([]);
  const [selectedKnowledgeFile, setSelectedKnowledgeFile] = useState<string>("");


  const [emotionRecognitionEnabled, setEmotionRecognitionEnabled] = useState<boolean>(false);


  useEffect(() => {
    // Set the initial value from the context
    setFirstMessage(voicebotDetails.firstMessage || "");
    setSystemPrompt(voicebotDetails["model"]["messages"][0]["content"] || "");
    setSelectedProvider(voicebotDetails["model"]["provider"] || undefined);
    setSelectedModel(voicebotDetails["model"]["model"] || undefined);
    setSelectedKnowledgeFile(voicebotDetails["model"]["knowledgeBase"]["fileIds"][0] || undefined);

   

    setStepsCount(voicebotDetails["model"]["temperature"] || 0);
    setMaxToken(voicebotDetails["model"]["maxTokens"] || "");
    setEmotionRecognitionEnabled(voicebotDetails["model"]["emotionRecognitionEnabled"]);


  },[ voicebotDetails.firstMessage, 
      voicebotDetails["model"]["messages"][0]["content"],
      voicebotDetails["model"]["provider"],
      voicebotDetails["model"]["model"],
      voicebotDetails["model"]["temperature"],
      voicebotDetails["model"]["maxTokens"],
      voicebotDetails["model"]["emotionRecognitionEnabled"]
    ]);

    useEffect(() => {
      getUsersFile();
    },[]);

    async function getUsersFile(){
      try {
        debugger;
          const response = await fetch(`${process.env.NEXT_PUBLIC_WEBSITE_URL}voicebot/dashboard/api/knowledge-file?userId=${cookies.userId}`)
          const data = await response.json();
          console.table(data.data);
          if(data.status === 200){
              //set the name as value and the id as label
              setUserFiles(data.data.map((file:any) => ({ value:file.fileData.id , label: file.fileData.name})));
          }
      }
      catch (error) {
          console.error(error);
      }
     
  }



  const firstMessageEnterHandler = (e:React.ChangeEvent<HTMLInputElement>) => {
    const enteredValue: string = e.target.value;
    // ;
    setFirstMessage(enteredValue);
    if (enteredValue.trim().length == 0) {
      setinputValidationMessage("Type the first message for the assistant");
      voiceBotContextData.updateState("firstMessage", "");
    } else {
      setinputValidationMessage("");
      voiceBotContextData.updateState("firstMessage",enteredValue);
    }
  }

  const fileKnowledgeChangeHandler = (value: string, option: any) => {
    console.log("file knowledge ", value, option);
    debugger;
    voiceBotContextData.updateState("knowledgeFile", value);
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
    ;
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

  const modelChangeHandlerListUpdate = () => {
    // 
    if (models.length === 0 && selectedProvider) {
      const selectedProviderList = providersOption.find(provider => provider.label === selectedProvider);
      if (selectedProviderList) {
        setModels(selectedProviderList.models.map(model => ({ value: model + ".", label: model })));
      }
    }
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
    
    setMaxToken(value);
    const intValue = parseInt(value, 10);
    if (!isNaN(intValue) && intValue <= 1000 && intValue > 50) {
      setValidationMessage("");
      voiceBotContextData.updateState("model.maxTokens", intValue);
    } else {
      setValidationMessage("Value must be greater than 50 and less than or equal to 1000");
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
        "gpt-4o-mini","gpt-4o-mini-2024-07-18", "gpt-4o", "gpt-4o-2024-05-13", "gpt-4o-2024-08-06", "gpt-4-turbo", "gpt-4-turbo-2024-04-09", "gpt-4-turbo-preview", "gpt-4-0125-preview", "gpt-4-1106-preview", "gpt-4", "gpt-4-0613", "gpt-3.5-turbo", "gpt-3.5-turbo-0125", "gpt-3.5-turbo-1106", "gpt-3.5-turbo-16k", "gpt-3.5-turbo-0613"
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
        <h4 className="input-header">First Message <span style={{ fontWeight: 'bold', color: inputValidationMessage ? 'red' : 'black' }}>*</span>

        </h4>
        <p className="input-description">The first message that the assistant will say.</p>
        <Input className={inputValidationMessage ? "input-field invalid-input" : "input-field"} 
        placeholder="Hi, Provide me the first message!" 
        onChange={firstMessageEnterHandler}  
          value={firstMessage} />

        {inputValidationMessage && <p className="invalidation-message">{inputValidationMessage}</p>}

        <h4 className="input-header second">System Prompt <span style={{ fontWeight: 'bold', color: systemPromptValidationMessage ? 'red' : 'black' }}>*</span></h4>
        <p className="input-description">The context allows you to customize your voicebot&lsquo;s personality, role and instructions. </p>
        
        <TextArea className={systemPromptValidationMessage ? "text-area invalid-input" : "text-area"}
         rows={4} 
         placeholder="Write your system prompts here..." 
         value={systemPrompt}
         onChange={systemPromptEnterHandler}
         />
           {systemPromptValidationMessage && <p className="invalidation-message">{systemPromptValidationMessage}</p>}
      </div>

      <div className="right-column">
        <h4 className="provider">Provider <span style={{ fontWeight: 'bold', color: providerValidationMessage ? 'red' : 'black' }}>*</span></h4>
        <Select
          className={providerValidationMessage ? "select-field error-provider" : "select-field"}
          placeholder="Select the provider"
          onChange={providerChangeHandler}
          onBlur={handleProviderBlur}
          value={selectedProvider}
          options={providersOption}
        />
        {providerValidationMessage && <p className="invalidation-message">{providerValidationMessage}</p>}

        <h4 className="provider model">Model <span style={{ fontWeight: 'bold', color: modelValidationMessage ? 'red' : 'black' }}>*</span></h4>
        <Select
          className={modelValidationMessage ? "select-field error-model" : "select-field"}
          placeholder="Select the model"
          value={selectedModel}
          options={models}
          onChange={modelChangeHandler}
          onClick={modelChangeHandlerListUpdate}
          onBlur={handleModelBlur}
        />
        {modelValidationMessage && <p className="invalidation-message">{modelValidationMessage}</p>}
        <p className="model-info">GPT-4o is more accurate but fast and cheaper</p>

        <h4 className="provider knowledge-base">Knowledge Base</h4>
        <Select
          className="select-field"
          placeholder="Select file"
          options={userFiles}
          onChange={fileKnowledgeChangeHandler}
        /> 

        <div className="temprature model">
          <h4 className="temprature_title">Temperatures</h4>
          <span className="temprature_value">{stepsCount}</span>
          {/* <Input className="temparature-input" value={stepsCount} onChange={stepsCountInputChangeHandler}/> */}
        </div>

        <Slider className="slider" step={0.1} min={0} max={2} value={stepsCount} onChange={stepsCountChangeHandler} />

        <h4 className="man-token">Max Token <span style={{ fontWeight: 'bold', color: validationMessage ? 'red' : 'black' }}>*</span></h4>

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