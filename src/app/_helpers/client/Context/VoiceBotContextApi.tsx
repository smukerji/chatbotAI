"use client";
import { createContext, useState, ReactNode } from "react";

// Define the initial state based on the provided data structure
const initialState = {
  firstMessage: "",
  transcriber: {
    provider: "",
    model: "",
    language: "",
    smartFormat: false,
    languageDetectionEnabled: false,
    keywords: [""],
    endpointing: 255,
  },
  model: {
    messages: [{ content: "default", role: "system" }],
    tools: [
      {
        async: false,
        messages: [
          {
            type: "request-start",
            content: "",
            conditions: [{ value: "", operator: "eq", param: "" }],
          },
        ],
        type: "dtmf",
        function: {
          name: "",
          description: "",
          parameters: { type: "object", properties: {}, required: [""] },
        },
        server: { timeoutSeconds: 20, url: "", secret: "" },
      },
    ],
    toolIds: [""],
    provider: "",
    model: "",
    temperature: 0,
    knowledgeBase: { provider: "canonical", topK: 5.5, fileIds: [""] },
    maxTokens: 300,
    emotionRecognitionEnabled: false,
    numFastTurns: 1,
  },
  voice: {
    fillerInjectionEnabled: false,
    provider: "azure",
    voiceId: "andrew",
    speed: 1.25,
    chunkPlan: {
      enabled: true,
      minCharacters: 300,
      punctuationBoundaries: [],//need to update this beffore sending it to vapi server
      formatPlan: {
        enabled: true,
        numberToDigitsCutoff: 2025,
        replacements: [{ type: "exact", key: "", value: "" }],
      },
    },
  },
  firstMessageMode: "assistant-speaks-first",
  llmRequestDelaySeconds: 0.1,
  responseDelaySeconds: 0.1,
  hipaaEnabled: false,
  clientMessages: [],//need to update this before sending to the vapi server
  serverMessages: [],//need to update this before sending to the vapi server
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
  endCallPhrases: [""],
  metadata: {},
  serverUrl: "",
  serverUrlSecret: "",
  analysisPlan: {
    summaryPrompt: "",
    summaryRequestTimeoutSeconds: 10.5,
    structuredDataRequestTimeoutSeconds: 10.5,
    successEvaluationPrompt: "",
    successEvaluationRubric: "NumericScale",
    successEvaluationRequestTimeoutSeconds: 10.5,
    structuredDataPrompt: "",
    structuredDataSchema: {
      type: "object", items: {}, properties: [""],/**this type is {} not [], [] is given for ui manage only. This need to refactor before the time value send to the vapi server */
      description: "", required: [""]
    },
    artifactPlan: { recordingEnabled: true, videoRecordingEnabled: false, recordingS3PathPrefix: "" },
    messagePlan: { idleMessages: [] /**this need to be update before sending to the vapi server. */, idleMessageMaxSpokenCount: 5.5, idleTimeoutSeconds: 17.5 },
    startSpeakingPlan: {
      waitSeconds: 0.4,
      smartEndpointingEnabled: false,
      transcriptionEndpointingPlan: { onPunctuationSeconds: 0.1, onNoPunctuationSeconds: 1.5, onNumberSeconds: 0.5 },
    },
    stopSpeakingPlan: { numWords: 0, voiceSeconds: 0.2, backoffSeconds: 1 },
    monitorPlan: { listenEnabled: false, controlEnabled: false },
    credentialIds: [""],
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

  const updateNestedState = (obj: any, path: string[], value: any): any => {
    // debugger;
    const [key, ...rest] = path;
    if (rest.length === 0) {
      obj[key] = value;
    } else {
      if (!obj[key]) obj[key] = {};
      obj[key] = updateNestedState(obj[key], rest, value);
    }
    return obj;
  };

  // const updateNestedState = (obj: any, key: string, value: any): any => {
  //   for (const k in obj) {
  //     debugger;
  //     if (k === key) {
  //       obj[k] = value;
  //       return true; // Indicate that the key was found and updated
  //     } else if (typeof obj[k] === "object" && obj[k] !== null) {
  //       const updated = updateNestedState(obj[k], key, value);
  //       if (updated) {
  //         return true; // Propagate the success up the call stack
  //       }
  //     }
  //   }
  //   return false; // Indicate that the key was not found in this branch
  // };

  const updateState = (key: string, value: any) => {
    // debugger
    const path = key.split(".");
    setState((prevState) => ({
      ...updateNestedState({ ...prevState }, path, value),
    }));
  };

  const updateTheVoiceBotInfo = (key: any) => (value: any) => {
    // debugger;
    setState((prevState) => ({ ...prevState, [key]: value }));
  }


  return (
    <CreateVoiceBotContext.Provider value={{ state, updateState, updateTheVoiceBotInfo, currentAssistantPage, setCurrentAssistantPage, isLoading, setIsLoading, setAssistantMongoId, assistantMongoId, assistantVapiId, setAssistantVapiId, assistantInfo, setAssistantInfo }}>
      {children}
    </CreateVoiceBotContext.Provider>
  );
};