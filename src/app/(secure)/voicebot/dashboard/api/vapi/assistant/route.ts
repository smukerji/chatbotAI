import { NextRequest, NextResponse } from "next/server";
import { apiHandler } from "../../../../../../_helpers/server/api/api-handler";
import clientPromise from "../../../../../../../db";
import { ObjectId } from "mongodb";

module.exports = apiHandler({
    POST: createVapiAssistant
  });

  //  voicebot/dashboard/api/template
async function createVapiAssistant(req: NextRequest) {

    try {

      const voicBotData = await req.json();

      const localData = voicBotData?.assistantLocalData;
      const vapiData = voicBotData?.assistantVapiData;
      return {result:"done"}


      /**
       * refactor the vapi data
       * 
       * serverUrl is empty then remove it from the payload
       * 
       * 'analysisPlan.property artifactPlan should not exist'
            6 =
            'analysisPlan.property messagePlan should not exist'
            7 =
            'analysisPlan.property startSpeakingPlan should not exist'
            8 =
            'analysisPlan.property stopSpeakingPlan should not exist'
            9 =
            'analysisPlan.property monitorPlan should not exist'
            10 =
            'analysisPlan.property credentialIds should not exist'

       * all above should check, if empty remove them

        * Refactor the StrucctureDataSchema
            
       */

      //structure data schema refactor

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
    else{
      vapiData.analysisPlan.structuredDataSchema.properties = {};
      delete vapiData.analysisPlan.structuredDataSchema;
      }

      delete vapiData.model.toolIds;
      // delete vapiData.voice.chunkPlan.punctuationBoundaries;
      delete vapiData.analysisPlan.artifactPlan;
      delete vapiData.analysisPlan.messagePlan;
      delete vapiData.analysisPlan.startSpeakingPlan;
      delete vapiData.analysisPlan.stopSpeakingPlan;
      delete vapiData.analysisPlan.monitorPlan;
      delete vapiData.analysisPlan.credentialIds;
      
    //punctuation boundaries refactor
    vapiData.voice.chunkPlan.punctuationBoundaries = vapiData.voice.chunkPlan.punctuationBoundaries.map((item: any) => item.label);

    //check if punctuation boundaries is empty
    let punctionBon = vapiData.voice.chunkPlan.punctuationBoundaries;
    if(Array.isArray(punctionBon) && punctionBon.length === 0){
      vapiData.voice.chunkPlan.punctuationBoundaries = ["，", "。"];
      }
      

      const db = (await clientPromise!).db();
      const collection = db?.collection("voice-assistance");
      
      //check if the record is exist in the db
        const voiceBotRecord = await collection?.findOne({ _id: new ObjectId(localData._id) });
        if (!voiceBotRecord) {
            return { error: "VoiceBot record not found" };
        }

        //send the data to the vapi server
        const options = {
            method: 'POST',
            headers: {Authorization: `Bearer ${process.env.VAPI_PRIVATE_KEY}`, 'Content-Type': 'application/json'},
            body: JSON.stringify(vapiData)
          };

        let vapiResponse = await fetch('https://api.vapi.ai/assistant', options);
        let vapiResponseData = await vapiResponse.json();
        if (!vapiResponseData?.id) {
            return { error: "Failed to create assistant" };
        }
        
        //update the voicebot record with the vapi assistant id
        const updateResult = await collection?.updateOne({ _id: new ObjectId(localData._id) }, { $set: { vapiAssistantId: vapiResponseData.id } });

        //if the record is not updated
        if(updateResult?.modifiedCount !== 1){
            // delete the assistant from the vapi server


            return { error: "Failed to update voicebot record" };
        }
        

        // Convert assistantTemplateIDs to ObjectId
        if (voicBotData.assistantTemplateIDs && Array.isArray(voicBotData.assistantTemplateIDs)) {
            voicBotData.assistantTemplateIDs = voicBotData.assistantTemplateIDs.map((id: string) => new ObjectId(id));
        }
        if(voicBotData.userId && typeof voicBotData.userId === "string"){
            voicBotData.userId = new ObjectId(voicBotData.userId);
        }
        
        return { result:"result" };
        
    }
    catch (error: any) {
        return { error: error.message };
    }

}
