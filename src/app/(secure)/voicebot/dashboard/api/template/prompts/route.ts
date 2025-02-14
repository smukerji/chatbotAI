import { NextRequest, NextResponse } from "next/server";
import { apiHandler } from "../../../../../../_helpers/server/api/api-handler";
import clientPromise from "../../../../../../../db";
import { ObjectId } from "mongodb";

module.exports = apiHandler({
  GET: getAssistantTemplatePrompt,
});

//  voicebot/dashboard/api/template
async function getAssistantTemplatePrompt(req: NextRequest) {
    try {

    
        const recordId = req.nextUrl.searchParams.get("recordId") as string;
    
        const db = (await clientPromise!).db();
        const collectionVoiceAssistant = db?.collection("voice-assistance");
    
        const assistantRecord = await collectionVoiceAssistant?.findOne({_id:new ObjectId(recordId)});

        const collectedId = assistantRecord?.assistantTemplateIDs.map((x:string)=>{
            return new ObjectId(x);
        });
        //check assistant template exist
        const collectionVoiceAssistantTemplate = db?.collection("voice-assistance-template");
        const bothExist = await collectionVoiceAssistantTemplate.find({_id: {$in: collectedId } }).toArray();

        if(collectedId.length !== bothExist.length){
            return { error: "Assistant template not found" };
        }

        const assistantTypeId = bothExist.filter((x:any)=> x.industryType == "Assistant" )[0]._id;


        const industryTypeId = bothExist.filter((x:any)=> x.industryType == 'Expert' )[0]._id;

        //get assistant template prompts
        
        const collectionVoiceAssistantTemplatePrompts = db?.collection("voice-prompt-template");
        const foundedPrompts = await collectionVoiceAssistantTemplatePrompts?.findOne({ assistantTypeId : assistantTypeId, industryTypeId: industryTypeId });
        if(collectionVoiceAssistantTemplatePrompts){

            return { prompts : foundedPrompts?.systemPrompt };

        }else{

            return { error: "Assistant template prompts not found" };

        }
      } catch (error: any) {
        return { error: error.message };
      }
}
