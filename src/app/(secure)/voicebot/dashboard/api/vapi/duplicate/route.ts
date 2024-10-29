import { NextRequest, NextResponse } from "next/server";
import { apiHandler } from "../../../../../../_helpers/server/api/api-handler";
import clientPromise from "../../../../../../../db";
import { ObjectId } from "mongodb";

module.exports = apiHandler({
    POST: createCopyVapiAssistant,
    // GET: getSingleAssistantDataFromVapi
});

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