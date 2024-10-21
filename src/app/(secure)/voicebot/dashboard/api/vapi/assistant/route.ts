import { NextRequest, NextResponse } from "next/server";
import { apiHandler } from "../../../../../../_helpers/server/api/api-handler";
import clientPromise from "../../../../../../../db";
import { ObjectId } from "mongodb";

module.exports = apiHandler({
    POST: createVapiAssistant,
    GET: getSingleAssistantDataFromVapi
  });

  //  voicebot/dashboard/api/template
async function createVapiAssistant(req: NextRequest) {

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
    else{
      delete vapiData.analysisPlan.structuredDataSchema;
      }

      delete vapiData.model.toolIds;
      // delete vapiData.voice.chunkPlan.punctuationBoundaries;
      delete vapiData.analysisPlan.artifactPlan;
      if(vapiData.analysisPlan.messagePlan?.idleMessages.length <= 0){//not grether than 0
        delete vapiData.analysisPlan.messagePlan;
      }
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
        const voiceBotRecord = await collection?.findOne({ 
          _id: new ObjectId(localData._id)
        });
        if (!voiceBotRecord) {
            return { error: "VoiceBot record not found" };
        }
        else{
          //if record is exist then check if the vapi assistant id is exist or not
          const voiceBotRecordVapiExist = await collection?.findOne({ 
            _id: new ObjectId(localData._id),
            vapiAssistantId: { $exists: true }
          });


          if (voiceBotRecordVapiExist) { //check if the record is already exist then update the record
            const options = {
              method: 'PUT',
              headers: { Authorization: `Bearer ${process.env.VAPI_PRIVATE_KEY}`, 'Content-Type': 'application/json' },
              body: JSON.stringify(vapiData)
            };

            // let vapiResponse = await fetch(`https://api.vapi.ai/assistant/${}`, options);
            // let vapiResponseData = await vapiResponse.json();
            // if (!vapiResponseData?.id) {
            //   return { error: "Failed to update the assistant" };
            // }
            // return { result: "Updated Successfully!"}
          }
          else { //if the record is not exist then create the record
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

            //update the voicebot record with the vapi assistant id
            const updateResult = await collection?.updateOne({ _id: new ObjectId(localData._id) }, { $set: { vapiAssistantId: vapiResponseData.id } });

            //if the record is not updated
            if (updateResult?.modifiedCount !== 1) {
              // delete the assistant from the vapi server
              return { error: "Failed to update voicebot record" };
            }
            else {
              return { result: "result", assistantVapiId: vapiResponseData?.id };
            }

          }

        }

    }
    catch (error: any) {
        return { error: error.message };
    }

}

async function getSingleAssistantDataFromVapi(req: NextRequest) {
  let step = 1;
  try{

    const vapiAssiId:string = req.nextUrl.searchParams.get("assistantId") as string;

    if(!vapiAssiId){
      return { error: "Assistant Id is required" };
    }
    //db access
    const db = (await clientPromise!).db();
    const collectionVoiceAssistant = db?.collection("voice-assistance");

    //check if the assistant id is exist in the db
    const voiceBotRecordVapiExist = await collectionVoiceAssistant?.findOne({ 
      vapiAssistantId: vapiAssiId
    });

    if (!voiceBotRecordVapiExist) {
      return { error: "VoiceBot record not found" };
    }

    //get the assistant data from the vapi server

    const options = {
      method: 'GET',
      headers: { Authorization: `Bearer ${process.env.VAPI_PRIVATE_KEY}` }
    };

    let vapiResponse = await fetch(`https://api.vapi.ai/assistant/${vapiAssiId}`, options);

    let vapiResponseData = await vapiResponse.json();
    if (!vapiResponseData?.id) {
      return { error: "Failed to get the assistant" };
    }

    return { result: vapiResponseData };

  }
  catch(error:any){
    console.log(`error in step ${step}`, error);
    return { error: error.message };
  }

}