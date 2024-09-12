"use client";
import { createContext, useState, ReactNode } from "react";

// Define the initial state based on the provided data structure
const initialState = {
  firstMessage: "",
  transcriber: {
    provider: "deepgram",
    model: "nova-2",
    language: "bg",
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
    provider: "anyscale",
    model: "",
    temperature: 1,
    knowledgeBase: { provider: "canonical", topK: 5.5, fileIds: [""] },
    maxTokens: 525,
    emotionRecognitionEnabled: true,
    numFastTurns: 1,
  },
  voice: {
    fillerInjectionEnabled: false,
    provider: "azure",
    voiceId: "andrew",
    speed: 1.25,
    chunkPlan: {
      enabled: true,
      minCharacters: 30,
      punctuationBoundaries: [
        "。",
        "，",
        ".",
        "!",
        "?",
        ";",
        "،",
        "۔",
        "।",
        "॥",
        "|",
        "||",
        ",",
        ":",
      ],
      formatPlan: {
        enabled: true,
        numberToDigitsCutoff: 2025,
        replacements: [{ type: "exact", key: "", value: "" }],
      },
    },
  },
  firstMessageMode: "assistant-speaks-first",
  hipaaEnabled: false,
  clientMessages: [
    "conversation-update",
    "function-call",
    "hang",
    "model-output",
    "speech-update",
    "status-update",
    "transcript",
    "tool-calls",
    "user-interrupted",
    "voice-input",
  ],
  serverMessages: [
    "conversation-update",
    "end-of-call-report",
    "function-call",
    "hang",
    "speech-update",
    "status-update",
    "tool-calls",
    "transfer-destination-request",
    "user-interrupted",
  ],
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
    structuredDataSchema: { type: "string", items: {}, properties: {}, description: "", required: [""] },
    artifactPlan: { recordingEnabled: true, videoRecordingEnabled: false, recordingS3PathPrefix: "" },
    messagePlan: { idleMessages: [""], idleMessageMaxSpokenCount: 5.5, idleTimeoutSeconds: 17.5 },
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
      <CreateVoiceBotContext.Provider value={{ state, updateState, updateTheVoiceBotInfo }}>
        {children}
      </CreateVoiceBotContext.Provider>
    );
  };