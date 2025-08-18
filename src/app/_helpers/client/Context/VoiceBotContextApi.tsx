"use client";
import { createContext, useState, useEffect, ReactNode } from "react";

// Define the initial state based on the provided data structure
const initialState = {
  firstMessage: "",
  transcriber: {
    provider: "deepgram",
    model: "nova-2",
    language: "en-IN",
    // smartFormat: false,
    languageDetectionEnabled: false,
    // keywords: [""],
    endpointing: 255,
  },
  model: {
    messages: [{ content: "default", role: "system" }],

    toolIds: [],
    provider: "openai",
    model: "gpt-4o",
    temperature: 0,

    maxTokens: 300,
    emotionRecognitionEnabled: false,
    numFastTurns: 1,
  },
  voice: {
    fillerInjectionEnabled: false,
    provider: "azure",
    voiceId: "andrew",
    // speed: 1.25,
    chunkPlan: {
      enabled: true,
      minCharacters: 10,
      punctuationBoundaries: [{ value: "0", label: "。" },
        { value: "1", label: "，" }],//need to update this beffore sending it to vapi server
      formatPlan: {
        enabled: true,
        numberToDigitsCutoff: 2025,
        // replacements: [{ type: "exact", key: "", value: "" }],
      },
    },
  },
  firstMessageMode: "assistant-speaks-first",
  llmRequestDelaySeconds: 0.1,
  responseDelaySeconds: 0.1,
  hipaaEnabled: false,
  // clientMessages: [],//need to update this before sending to the vapi server
  // serverMessages: [],//need to update this before sending to the vapi server
  silenceTimeoutSeconds: 30,
  maxDurationSeconds: 600,
  backgroundSound: "office",
  backchannelingEnabled: false,
  backgroundDenoisingEnabled: false,
  modelOutputInMessagesEnabled: false,
  transportConfigurations: [
    { provider: "twilio", timeout: 60, record: false, recordingChannels: "mono" },
  ],
  name: "",
  numWordsToInterruptAssistant: 0,

  voicemailDetection: {
    provider: "twilio",
    voicemailDetectionTypes: ["machine_end_beep", "machine_end_silence"],
    enabled: true,
    machineDetectionTimeout: 31,
    machineDetectionSpeechThreshold: 3500,
    machineDetectionSpeechEndThreshold: 2750,
    machineDetectionSilenceTimeout: 6000,
  },
  voicemailMessage: "",
  endCallMessage: "",
  // endCallPhrases: [""],
  metadata: {},
  // serverUrl: "",
  // serverUrlSecret: "",
  analysisPlan: {
    summaryPrompt: "",
    summaryRequestTimeoutSeconds: 10.5,
    structuredDataRequestTimeoutSeconds: 10.5,
    successEvaluationPrompt: "",
    successEvaluationRubric: "NumericScale",
    successEvaluationRequestTimeoutSeconds: 10.5,
    structuredDataPrompt: "",
    structuredDataSchema: {
      type: "object",  properties: [""],/**this type is {} not [], [] is given for ui manage only. This need to refactor before the time value send to the vapi server */
    },
    
    artifactPlan: { recordingEnabled: true, videoRecordingEnabled: false, recordingS3PathPrefix: "" },//deleted
    messagePlan: { idleMessages: [] /**this need to be update before sending to the vapi server. */, idleMessageMaxSpokenCount: 5.5, idleTimeoutSeconds: 17.5 },//delete
    startSpeakingPlan: {
      waitSeconds: 0.4,
      smartEndpointingEnabled: false,
      transcriptionEndpointingPlan: { onPunctuationSeconds: 0.1, onNoPunctuationSeconds: 1.5, onNumberSeconds: 0.5 },
    },//deleted
    stopSpeakingPlan: { numWords: 0, voiceSeconds: 0.2, backoffSeconds: 1 },//deleted
    monitorPlan: { listenEnabled: false, controlEnabled: false },//deleted
    credentialIds: [""],//deleted
  },
};





// Create the context
export const CreateVoiceBotContext = createContext({
  // state: initialState,
  // updateState: (key: string, value: any) => {},
});

// Create the provider component
export const VoiceBotDataProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState(initialState);

  const [isLoading, setIsLoading] = useState(false);

  const [assistantMongoId, setAssistantMongoId] = useState(null);

  const [currentAssistantPage, setCurrentAssistantPage] = useState(0);

  const [assistantVapiId, setAssistantVapiId] = useState(null);

  const [assistantInfo, setAssistantInfo] = useState(null);

  const [isPublishEnabled, setIsPublishEnabled] = useState(false);

  const [publishLoading,setPublishLoading] = useState(false);

  const [afterPublishLoading,setAfterPublishLoading] = useState(false);

  const updateNestedState = (obj: any, path: string[], value: any): any => {
    // ;
    const [key, ...rest] = path;
    if (rest.length === 0) {
      obj[key] = value;
    } else {
      if (!obj[key]) obj[key] = {};
      obj[key] = updateNestedState(obj[key], rest, value);
    }
    return obj;
  };

  const updateState = (key: string, value: any) => {
    // 
    const path = key.split(".");
    setState((prevState) => ({
      ...updateNestedState({ ...prevState }, path, value),
    }));
  };

  const reInitiateState = () => {
    setState(initialState);
  }

  const updateTheVoiceBotInfo = (key: any) => (value: any) => {
    // ;
    setState((prevState) => ({ ...prevState, [key]: value }));
  }


  useEffect(() => {
    if(afterPublishLoading){
      setAfterPublishLoading(false);
      setIsPublishEnabled(false);
      setPublishLoading(false);
    }
  },[afterPublishLoading]);

  useEffect(() => {
    const { provider, model, language } = state.transcriber;
    const { messages: modelMessages, provider: modelProvider, model: modelsModel, maxTokens } = state.model;
    const {chunkPlan} = state.voice;
    const {punctuationBoundaries,minCharacters} = chunkPlan;
    if (provider && model && language && modelProvider && modelsModel && state.firstMessage && state.name && maxTokens && (typeof maxTokens === 'number') && punctuationBoundaries.length > 0 && minCharacters > 0 && modelMessages[0].content.length > 0) {
      
      setIsPublishEnabled(true);
      if(publishLoading){
        setIsPublishEnabled(false);
        setPublishLoading(false);
      }
    } else {
      setIsPublishEnabled(false);
      setPublishLoading(false);
    }
  }, [state]);

  return (
    <CreateVoiceBotContext.Provider value={{ state, setState,updateState, updateTheVoiceBotInfo, currentAssistantPage, setCurrentAssistantPage, isLoading, setIsLoading, setAssistantMongoId, assistantMongoId, assistantVapiId, setAssistantVapiId, assistantInfo, setAssistantInfo , isPublishEnabled, setIsPublishEnabled, reInitiateState,setPublishLoading,publishLoading,afterPublishLoading,setAfterPublishLoading}}>
      {children}
    </CreateVoiceBotContext.Provider>
  );
};