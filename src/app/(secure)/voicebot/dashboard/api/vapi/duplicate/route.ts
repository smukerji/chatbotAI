import { NextRequest, NextResponse } from "next/server";
import { apiHandler } from "../../../../../../_helpers/server/api/api-handler";
import clientPromise from "../../../../../../../db";
import { ObjectId } from "mongodb";

module.exports = apiHandler({
    POST: createDuplicateVapiAssistant,
    // GET: getSingleAssistantDataFromVapi
});

async function createDuplicateVapiAssistant(req: NextRequest) {
    try {

        const { assistantLocalData } = await req.json();
        const vapiAssiId = assistantLocalData?.vapiAssistantId;

        //get vapi assistant data
        const options = {
            method: 'GET',
            headers: { Authorization: `Bearer ${process.env.VAPI_PRIVATE_KEY}` }
        };

        let vapiResponse: any = await fetch(`https://api.vapi.ai/assistant/${vapiAssiId}`, options);
        let vapiResponseData = await vapiResponse.json();

        let assistantParseDataForPost = parseAssistantData(vapiResponseData);

        /**start */
        let propertyArrayData = assistantParseDataForPost.analysisPlan.structuredDataSchema.properties;

        if (Array.isArray(propertyArrayData) && propertyArrayData[0] !== "") {
            const propertiesObject = propertyArrayData?.reduce((acc: any, item: any) => {
                acc[item.name] = {
                    type: item.type,
                    description: item.description
                };
                return acc;
            }, {});

            assistantParseDataForPost.analysisPlan.structuredDataSchema.properties = propertiesObject;
        }
        else {
            delete assistantParseDataForPost.analysisPlan.structuredDataSchema;
        }

        delete assistantParseDataForPost.model.toolIds;
        // delete assistantParseDataForPost.voice.chunkPlan.punctuationBoundaries;
        delete assistantParseDataForPost.analysisPlan.artifactPlan;
        // if(assistantParseDataForPost.analysisPlan.messagePlan?.idleMessages.length <= 0){//not grether than 0
        // }
        delete assistantParseDataForPost.analysisPlan.messagePlan;
        delete assistantParseDataForPost.analysisPlan.startSpeakingPlan;
        delete assistantParseDataForPost.analysisPlan.stopSpeakingPlan;
        delete assistantParseDataForPost.analysisPlan.monitorPlan;
        delete assistantParseDataForPost.analysisPlan.credentialIds;

        //punctuation boundaries refactor
        assistantParseDataForPost.voice.chunkPlan.punctuationBoundaries = assistantParseDataForPost.voice.chunkPlan.punctuationBoundaries.map((item: any) => item.label);

        //check if punctuation boundaries is empty
        let punctionBon = assistantParseDataForPost.voice.chunkPlan.punctuationBoundaries;
        if (Array.isArray(punctionBon) && punctionBon.length === 0) {
            assistantParseDataForPost.voice.chunkPlan.punctuationBoundaries = ["，", "。"];
        }



        /**end */

        //executing the vapi post assistant request
        const postOptions = {
            method: 'POST',
            headers: { Authorization: `Bearer ${process.env.VAPI_PRIVATE_KEY}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(assistantParseDataForPost)
        };

        let postVapiResponse = await fetch('https://api.vapi.ai/assistant', postOptions);
        let postVapiResponseData = await postVapiResponse.json();
        if (!postVapiResponseData?.id) {
            return { error: "Failed to create assistant" };
        }

        /**now assistant created. */

        //get the assistantInfo
        const db = (await clientPromise!).db();
        const voiceAssistantCollection = db?.collection("voice-assistance");
        const insertedRecord = await voiceAssistantCollection?.findOne({ vapiAssistantId: vapiAssiId });
        if (!insertedRecord) {
            return { error: "Assistant not found!" };
        }

        //create duplicate record
        const newVoiceBotRecord = {
            userId: insertedRecord.userId,
            imageUrl: insertedRecord?.imageUrl,
            assistantTemplateIDs: insertedRecord.assistantTemplateIDs,
            assistantName: `${insertedRecord?.assistantName} (copy)`,
            vapiAssistantId: postVapiResponseData.id
        };

        const result = await voiceAssistantCollection?.insertOne(newVoiceBotRecord);
        if (result.insertedId) {
            const insertedRecord = await voiceAssistantCollection?.findOne({ _id: result.insertedId });
            return { record: insertedRecord, result: "Duplicate Assistant Added!" };
        } else {
            return { error: "Failed to insert record" };
        }




        return { result: "result", assistantVapiId: vapiResponseData?.id };
        // return 


    }
    catch(error: any){
        return { error: error.message };
    }
}

function parseAssistantData(assistantDataResponseParse: any) {

    const initialState = {
        firstMessage: "",
        transcriber: {
            provider: "",
            model: "",
            language: "",
            // smartFormat: false,
            languageDetectionEnabled: false,
            // keywords: [""],
            endpointing: 255,
        },
        model: {
            messages: [{ content: "default", role: "system" }],
            // tools: [
            //   {
            //     async: false,
            //     messages: [
            //       {
            //         type: "request-start",
            //         content: "",
            //         conditions: [{ value: "", operator: "eq", param: "" }],
            //       },
            //     ],
            //     type: "dtmf",
            //     function: {
            //       name: "",
            //       description: "",
            //       parameters: { type: "object", properties: {}, required: [""] },
            //     },
            //     server: { timeoutSeconds: 20, url: "", secret: "" },
            //   },
            // ],
            toolIds: [""],//we deleted this field in the backend
            provider: "",
            model: "",
            temperature: 0,
            // knowledgeBase: { provider: "canonical", topK: 5.5, fileIds: [""] },
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
                type: "object", properties: [""],/**this type is {} not [], [] is given for ui manage only. This need to refactor before the time value send to the vapi server */
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

    try {


        const vapiAssistanceData = assistantDataResponseParse;

        let assistantData: any = initialState;
        assistantData.firstMessage = vapiAssistanceData.firstMessage;
        assistantData.transcriber = vapiAssistanceData.transcriber;
        assistantData.model = vapiAssistanceData.model;
        assistantData.voice = vapiAssistanceData.voice;
        assistantData.name = vapiAssistanceData.name + " (copy)";
        //piping the voice data
        let punctuationBoundaries = assistantData.voice.chunkPlan.punctuationBoundaries;
        // ["。","，"]
        const punctuationBoundaryPredefineValues = [
            { value: "0", label: "。" },
            { value: "1", label: "，" },
            { value: "2", label: "." },
            { value: "3", label: "!" },
            { value: "4", label: "?" },
            { value: "5", label: ";" },
            { value: "6", label: "،" },
            { value: "7", label: "۔" },
            { value: "8", label: "।" },
            { value: "9", label: "॥" },
            { value: "10", label: "|" },
            { value: "11", label: "||" },
            { value: "12", label: "," },
            { value: "13", label: ":" }
        ];

        let punctuationBoundariesArray = punctuationBoundaryPredefineValues.filter(item =>
            punctuationBoundaries.includes(item.label)
        );

        assistantData.voice.chunkPlan.punctuationBoundaries = punctuationBoundariesArray;
        assistantData.firstMessageMode = vapiAssistanceData.firstMessageMode;
        assistantData.llmRequestDelaySeconds = vapiAssistanceData.llmRequestDelaySeconds;
        assistantData.responseDelaySeconds = vapiAssistanceData.responseDelaySeconds;
        assistantData.hipaaEnabled = vapiAssistanceData.hipaaEnabled;
        assistantData.silenceTimeoutSeconds = vapiAssistanceData.silenceTimeoutSeconds;
        assistantData.maxDurationSeconds = vapiAssistanceData.maxDurationSeconds;
        assistantData.backgroundSound = vapiAssistanceData.backgroundSound;
        assistantData.backchannelingEnabled = vapiAssistanceData.backchannelingEnabled;
        assistantData.backgroundDenoisingEnabled = vapiAssistanceData.backgroundDenoisingEnabled;
        assistantData.modelOutputInMessagesEnabled = vapiAssistanceData.modelOutputInMessagesEnabled;
   
        assistantData.numWordsToInterruptAssistant = vapiAssistanceData.numWordsToInterruptAssistant;
        assistantData.voicemailDetection = vapiAssistanceData.voicemailDetection;
        assistantData.voicemailMessage = vapiAssistanceData.voicemailMessage;
        assistantData.endCallMessage = vapiAssistanceData.endCallMessage;
        // endCallPhrases= [""],
        assistantData.metadata = vapiAssistanceData.metadata;


        let analysysPlanPickData = vapiAssistanceData.analysisPlan;

        if (analysysPlanPickData?.structuredDataSchema && analysysPlanPickData?.structuredDataSchema?.properties) {
            let propertiesData = analysysPlanPickData?.structuredDataSchema?.properties;
            if (Object.keys(propertiesData).length > 0) {

                const propertyArrayData = Object.entries(propertiesData).map(([name, value]: [string, any], index: number) => ({
                    id: index,
                    name,
                    type: value.type,
                    description: value.description,
                    saved: true
                }));
                // assistantData.analysisPlan = vapiAssistanceData.analysisPlan;
                assistantData.analysisPlan.structuredDataSchema.properties = propertyArrayData;
            }
            else {
                assistantData.analysisPlan.structuredDataRequestTimeoutSeconds = vapiAssistanceData.analysisPlan.tructuredDataRequestTimeoutSeconds;
                assistantData.analysisPlan.successEvaluationRequestTimeoutSeconds = vapiAssistanceData.analysisPlan.successEvaluationRequestTimeoutSeconds;
                assistantData.analysisPlan.successEvaluationRubric = vapiAssistanceData.analysisPlan.successEvaluationRubric;
                assistantData.analysisPlan.summaryRequestTimeoutSeconds = vapiAssistanceData.analysisPlan.summaryRequestTimeoutSeconds;

            }
        }
        else {
            assistantData.analysisPlan.structuredDataRequestTimeoutSeconds = vapiAssistanceData.analysisPlan.tructuredDataRequestTimeoutSeconds;
            assistantData.analysisPlan.successEvaluationRequestTimeoutSeconds = vapiAssistanceData.analysisPlan.successEvaluationRequestTimeoutSeconds;
            assistantData.analysisPlan.successEvaluationRubric = vapiAssistanceData.analysisPlan.successEvaluationRubric;
            assistantData.analysisPlan.summaryRequestTimeoutSeconds = vapiAssistanceData.analysisPlan.summaryRequestTimeoutSeconds;

        }

        if (vapiAssistanceData?.messagePlan && vapiAssistanceData?.messagePlan?.idleMessages) {
            let messagePlanPickData = vapiAssistanceData.messagePlan.idleMessages;

            const idleMessageList = [
                { value: "1", label: "Are you still there?" },
                { value: "2", label: "Is there anything else you need help with?" },
                { value: "3", label: "Feel free to ask me any questions." },
                { value: "4", label: "How can I assist you further?" },
                { value: "5", label: "Let me know if there's anything you need." },
                { value: "6", label: "I'm still here if you need assistance." },
                { value: "7", label: "I'm ready to help whenever you are." },
                { value: "8", label: "Is there something specific you're looking for?" },
                { value: "9", label: "I'm here to help with any questions you have." }
            ];

            if (messagePlanPickData.length > 0) {
                const idleMessageArray = idleMessageList.filter(item =>
                    messagePlanPickData.includes(item.label)
                );
                assistantData.analysisPlan.messagePlan.idleMessages = idleMessageArray;
            }

        }

        //update the context data
        // voiceBotContextData.setState(assistantData);
        return assistantData;
    }
    catch (error: any) {
        return { error: error.message };
    }
}

//  voicebot/dashboard/api/template
async function createCopyVapiAssistant(req: NextRequest) {

    try {

        const voicBotData = await req.json();

        const localData = voicBotData?.assistantLocalData;
        const vapiData = voicBotData?.assistantVapiData;
        // return {result:"done"}

        let propertyArrayData = vapiData.analysisPlan.structuredDataSchema.properties;

        if (Array.isArray(propertyArrayData) && propertyArrayData[0] !== "") {
            const propertiesObject = propertyArrayData?.reduce((acc: any, item: any) => {
                acc[item.name] = {
                    type: item.type,
                    description: item.description
                };
                return acc;
            }, {});

            vapiData.analysisPlan.structuredDataSchema.properties = propertiesObject;
        }
        else {
            delete vapiData.analysisPlan.structuredDataSchema;
        }

        delete vapiData.model.toolIds;
        // delete vapiData.voice.chunkPlan.punctuationBoundaries;
        delete vapiData.analysisPlan.artifactPlan;
        // if(vapiData.analysisPlan.messagePlan?.idleMessages.length <= 0){//not grether than 0
        // }
        delete vapiData.analysisPlan.messagePlan;
        delete vapiData.analysisPlan.startSpeakingPlan;
        delete vapiData.analysisPlan.stopSpeakingPlan;
        delete vapiData.analysisPlan.monitorPlan;
        delete vapiData.analysisPlan.credentialIds;

        //adding 'copy' text as postfix to the assistant name
        vapiData.name = `${vapiData.name} (copy)`;

        //punctuation boundaries refactor
        vapiData.voice.chunkPlan.punctuationBoundaries = vapiData.voice.chunkPlan.punctuationBoundaries.map((item: any) => item.label);

        //check if punctuation boundaries is empty
        let punctionBon = vapiData.voice.chunkPlan.punctuationBoundaries;
        if (Array.isArray(punctionBon) && punctionBon.length === 0) {
            vapiData.voice.chunkPlan.punctuationBoundaries = ["，", "。"];
        }


        const db = (await clientPromise!).db();
        const collection = db?.collection("voice-assistance");

        //check if the record is exist in the db
        const voiceBotRecord = await collection?.findOne({
            _id: new ObjectId(localData._id)
        });
        if (!voiceBotRecord) {
            return { error: "VoiceBot record not found" };
        }
        else {
            voiceBotRecord.assistantName = `${voiceBotRecord.assistantName} (copy)`;
            //if record is exist then check if the vapi assistant id is exist or not
            const voiceBotRecordVapiExist = await collection?.findOne({
                _id: new ObjectId(localData._id),
                vapiAssistantId: { $exists: true }
            });


            if (voiceBotRecordVapiExist) { //check if the record exist then create the duplicate record

                //send the data to the vapi server
                const options = {
                    method: 'POST',
                    headers: { Authorization: `Bearer ${process.env.VAPI_PRIVATE_KEY}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify(vapiData)
                };

                let vapiResponse = await fetch('https://api.vapi.ai/assistant', options);
                let vapiResponseData = await vapiResponse.json();
                if (!vapiResponseData?.id) {
                    return { error: "Failed to create assistant" };
                }

                //create the new entry in the db (mongodb)

                const collectionVoiceAssistant = db?.collection("voice-assistance");
                const { userId, imageUrl, assistantTemplateIDs, assistantName } = voiceBotRecord;

                const newVoiceBotRecord = {
                    userId,
                    imageUrl,
                    assistantTemplateIDs,
                    assistantName,
                    vapiAssistantId: vapiResponseData.id
                };

                const result = await collectionVoiceAssistant?.insertOne(newVoiceBotRecord);
                if (result.insertedId) {
                    const insertedRecord = await collection?.findOne({ _id: result.insertedId });
                    return { record: insertedRecord, result: "Duplicate Assistant Added!" };
                    // return { result: "result", assistantVapiId: vapiResponseData?.id };
                } else {
                    return { error: "Failed to insert record" };
                }
            }
            else { //if the record is not exist then send error message
                return { error: "Assistant not found!" };
            }

        }

    }
    catch (error: any) {
        return { error: error.message };
    }

}