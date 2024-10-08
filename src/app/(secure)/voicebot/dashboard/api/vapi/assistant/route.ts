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
        
        const db = (await clientPromise!).db();
        const collection = db?.collection("voice-assistance");
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


/**
 * //refactor the analysis data
      let assistantData = voicebotDetails;
      let analysisData = assistantData?.analysisPlan;
      let sturctureData = analysisData?.structuredDataSchema;
      let propertyArrayData = sturctureData?.properties;

      const propertiesObject = propertyArrayData?.reduce((acc:any, item:any) => {
        acc[item.name] = {
          type: item.type,
          description: item.description
        };
        return acc;
      }, {});

      //object assigned to the properties
      if (sturctureData) {
        sturctureData.properties = propertiesObject;
        analysisData.structuredDataSchema = sturctureData;
        assistantData.analysis = analysisData;
      }
     

      //refactor the punctualtion boundaries
      assistantData.voice.chunkPlan.punctuationBoundaries = assistantData.voice.chunkPlan.punctuationBoundaries.map((item: any) => item.value);

      //refactor the client messages
 */