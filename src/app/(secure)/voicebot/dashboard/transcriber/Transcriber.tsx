import dynamic from "next/dynamic";
import "./design.scss";
import { Input, Slider, Switch } from 'antd';
import { Select, ConfigProvider } from 'antd';

import { useState, useContext, useEffect } from "react";
import { CreateVoiceBotContext } from "../../../../_helpers/client/Context/VoiceBotContextApi"



const { TextArea } = Input;

function Transcriber() {

  const voiceBotContextData: any = useContext(CreateVoiceBotContext);
  const voicebotDetails = voiceBotContextData.state;



  const [models, setModels] = useState<{ value: string; label: string }[]>([]);
  const [selectedModel, setSelectedModel] = useState<string | undefined>(undefined);
  const [language, setLanguage] = useState<{ value: string; label: string }[]>([]);
  const [selectedLanguage, setSelectedLanguage] = useState<string | undefined>(undefined);
  const [selectedProvider, setSelectedProvider] = useState<string | undefined>(undefined);


  useEffect(() => {
    // Set the initial value from the context
    setSelectedProvider(voicebotDetails["transcriber"]["provider"]);
    setSelectedModel(voicebotDetails["transcriber"]["model"]);
    setSelectedLanguage(voicebotDetails["transcriber"]["language"]);

  }, [
    voicebotDetails["transcriber"]["provider"],
    voicebotDetails["transcriber"]["model"],
    voicebotDetails["transcriber"]["language"]
  ]);


  const providerChangeHandler = (value:any,options:any)=>{

    setSelectedProvider(options.label);
    voiceBotContextData.updateState("transcriber.provider", options.label);

    // Update models based on selected provider
    const selectedProvider = providerList.find(provider => provider.label === options.label);

    if (selectedProvider) {
      setModels(selectedProvider.model.map(model => ({ value: model+".", label: model })));
      setLanguage(selectedProvider.language.map(language => ({ value: language+".", label: language })));
    } else {
      setModels([]);
      setLanguage([]);
    }

    //reset the model value
    setSelectedModel(undefined);
    voiceBotContextData.updateState("transcriber.model", undefined);
    setSelectedLanguage(undefined);
    voiceBotContextData.updateState("transcriber.language", undefined);
  }

  const modelChangeHandler = (value: string, option: any) => {
    // debugger;
    setSelectedModel(option.label);
    // setModelValidationMessage("");// Clear validation message on valid selection
    voiceBotContextData.updateState("transcriber.model", option.label);
  }

  const modelChangeHandlerListUpdate = () => {
    // debugger
    if (models.length === 0 && selectedProvider) {
      console.log("selected model providers ", selectedProvider)
      // debugger;
      const selectedProviderList = providerList.find(provider => provider.label === selectedProvider);
      if (selectedProviderList) {
        setModels(selectedProviderList.model.map(model => ({ value: model+".", label: model })));
        // setLanguage(selectedProviderList.language.map(language => ({ value: language+".", label: language })));
      }
    }
  }

  const languageChangeHandlerListUpdate = () => {
    if(language.length === 0 && selectedProvider){
      const selectedProviderList = providerList.find(provider => provider.label === selectedProvider);
      if (selectedProviderList) {
        // setModels(selectedProviderList.model.map(model => ({ value: model+".", label: model })));
        setLanguage(selectedProviderList.language.map(language => ({ value: language+".", label: language })));
      }
    }
  }

  const languageChangeHandler = (value: string, option: any) => {
    // debugger;
    setSelectedLanguage(option.label);
    // setModelValidationMessage("");// Clear validation message on valid selection
    voiceBotContextData.updateState("transcriber.language", option.label);
  }


  console.log("your voicebot details ", voicebotDetails["transcriber"]);



  const providerList = [
    {
      value: "1",
      label: "deepgram",
      language:[
        "bg",
        "ca",
        "cs",
        "da",
        "da-DK",
        "de",
        "de-CH",
        "el",
        "en",
        "en-AU",
        "en-GB",
        "en-IN",
        "en-NZ",
        "en-US",
        "es",
        "es-419",
        "es-LATAM",
        "et",
        "fi",
        "fr",
        "fr-CA",
        "hi",
        "hi-Latn",
        "hu",
        "id",
        "it",
        "ja",
        "ko",
        "ko-KR",
        "lt",
        "lv",
        "ms",
        "multi",
        "nl",
        "nl-BE",
        "no",
        "pl",
        "pt",
        "pt-BR",
        "ro",
        "ru",
        "sk",
        "sv",
        "sv-SE",
        "ta",
        "taq",
        "th",
        "th-TH",
        "tr",
        "uk",
        "vi",
        "zh",
        "zh-CN",
        "zh-Hans",
        "zh-Hant",
        "zh-TW"
      ],
      model:[
        "nova-2",
        "nova-2-general",
        "nova-2-meeting",
        "nova-2-phonecall",
        "nova-2-finance",
        "nova-2-conversationalai",
        "nova-2-voicemail",
        "nova-2-video",
        "nova-2-medical",
        "nova-2-drivethru",
        "nova-2-automotive",
        "nova",
        "nova-general",
        "nova-phonecall",
        "nova-medical",
        "enhanced",
        "enhanced-general",
        "enhanced-meeting",
        "enhanced-phonecall",
        "enhanced-finance",
        "base",
        "base-general",
        "base-meeting",
        "base-phonecall",
        "base-finance",
        "base-conversationalai",
        "base-voicemail",
        "base-video"
      ]
    },
    {
      value: "2",
      label: "talkscriber",//label
      language:[
        "en", // English
        "zh", // Chinese
        "de", // German
        "es", // Spanish
        "ru", // Russian
        "ko", // Korean
        "fr", // French
        "pt", // Portuguese
        "tr", // Turkish
        "pl", // Polish
        "ja", // Japanese
        "ca", // Catalan
        "nl", // Dutch
        "sv", // Swedish
        "ar", // Arabic
        "it", // Italian
        "id", // Indonesian
        "hi", // Hindi
        "fi", // Finnish
        "vi", // Vietnamese
        "he",  // Hebrew
        "uk", // Ukrainian
        "el", // Greek
        "ms", // Malay
        "cs", // Czech
        "ro", // Romanian
        "da", // Danish
        "hu", // Hungarian
        "ta", // Tamil
        "no", // Norwegian
        "th", // Thai
        "ur", // Urdu
        "hr", // Croatian
        "bg", // Bulgarian
        "lt", // Lithuanian
        "la", // Latin
        "mi", // Maori
        "ml", // Malayalam
        "cy", // Welsh
        "sk", // Slovak
        "te", // Telugu
        "fa", // Persian
        "lv", // Latvian
        "bn", // Bengali
        "sr",
        "az",
        "sl",
        "kn",
        "et",
        "mk",
        "br",
        "eu",
        "is",
        "hy",
        "ne",
        "mn",
        "bs",
        "kk",
        "sq",
        "sw",
        "gl",
        "mr",
        "pa",
        "si",
        "km",
        "yo",
        "so",
        "af",
        "oc",
        "ka",
        "be",
        "tg",
        "sd",
        "gu",
        "am",
        "yi",
        "lo",
        "uz",
        "fo",
        "ht",
        "ps",
        "tk",
        "nn",
        "mt",
        "sa",
        "lb",
        "my",
        "bo",
        "tl",
        "mg",
        "as",
        "tt",
        "haw",
        "ln",
        "ha",
        "ba",
        "jw",
        "su",
        "yue"
      ],
      model:["Whisper"]
    },
    {
      value: "3",
      label: "gladia",
      language: [
        "af",
        "sq",
        "am",
        "ar",
        "hy",
        "as",
        "az",
        "ba",
        "eu",
        "be",
        "bn",
        "bs",
        "br",
        "bg",
        "ca",
        "zh",
        "hr",
        "cs",
        "da",
        "nl",
        "en",
        "et",
        "fo",
        "fi",
        "fr",
        "gl",
        "ka",
        "de",
        "el",
        "gu",
        "ht",
        "ha",
        "haw",
        "he",
        "hi",
        "hu",
        "is",
        "id",
        "it",
        "ja",
        "jp",
        "jv",
        "kn",
        "kk",
        "km",
        "ko",
        "lo",
        "la",
        "lv",
        "ln",
        "lt",
        "lb",
        "mk",
        "mg",
        "ms",
        "ml",
        "mk",
        "mi",
        "mr",
        "mn",
        "mymr",
        "ne",
        "no",
        "nn",
        "oc",
        "ps",
        "fa",
        "pl",
        "pt",
        "pa",
        "ro",
        "ru",
        "sa",
        "sr",
        "sn",
        "sd",
        "si",
        "sk",
        "sl",
        "so",
        "es",
        "su",
        "sw",
        "sv",
        "tl",
        "tg",
        "ta",
        "tt",
        "te",
        "th",
        "bo",
        "tr",
        "tk",
        "uk",
        "ur",
        "uz",
        "vi",
        "cy",
        "yi",
        "yo"
      ],
      model:["Fast","Accurate"]
    }
  ]
  
  return (
    <div className="transcribe-container">
      <div className="left-column">
        <h4 className="provider">Provider</h4>
        <Select
          className="select-field"
          placeholder="Select the provider"
          onChange={providerChangeHandler}
          options={providerList}
          value={selectedProvider}
        />

        <h4 className="provider model">Model</h4>
        <Select
          className="select-field"
          placeholder="Select the model"
          options={models}
          onChange={modelChangeHandler}
          onClick={modelChangeHandlerListUpdate}
          value={selectedModel}
        />
        <p className="model-info">GPT-4 is more accurate but slower and costlier than GPT-3.5 Turbo (1 min = 1 credit for GPT-3.5 Turbo, 20 credits for GPT-4).</p>

      </div>
      <div className="right-column">
        <h4 className="provider language">Language</h4>
        <Select
          className="select-field"
          placeholder="Select the model"
          options={language}
          onChange={languageChangeHandler}
          onClick={languageChangeHandlerListUpdate}
          value={selectedLanguage}
        />
      </div>
    </div>
  )
}

export default dynamic((): any => Promise.resolve(Transcriber), { ssr: false });