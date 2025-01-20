import { CreateVoiceBotContext } from '@/app/_helpers/client/Context/VoiceBotContextApi';
import React, {
    useContext,
  } from 'react';
import getUnixTime from "date-fns/getUnixTime";
export const updateAssistantMetaDataService = async (assistantId:string)=>{

}

export const updateAssistantNumberOfCallMetaDataService = async (assistantId:string,assistantMId:string)=>{

    try{
      if(!assistantId || !assistantMId){
        return { error: "Assistant Id is required" };
      }

        const options = {
            method: 'GET',
            headers: {Authorization: process.env.NEXT_PUBLIC_VAP_PRI_KEY as string} //private api key
          };

        const callLogResponse = await fetch(`https://api.vapi.ai/v2/call?limit=${10}&page=${1}&assistantId=${assistantId}`, options);
        const data = await callLogResponse.json();
        const totalCallLogs = data?.metadata?.totalItems || 0;

        //update the assistant metadata
        const assistantUpdateMetadataResponse = await fetch(
          `${process.env.NEXT_PUBLIC_WEBSITE_URL}voicebot/dashboard/api/phone/meta?assistantMId=${assistantMId}`,
          {
            method: "PUT",
            body: JSON.stringify({
              totalCallLogs: totalCallLogs,
            })
          }
        );

        const parseResponse = await assistantUpdateMetadataResponse.json();
        console.log('assistantCreateData:', parseResponse);


    }
    catch(error:any){
        console.error('Error parsing request body:', error);
        return { message  : error };
    }

}

export const updateAssistantLastUsedMetaDataService = async (assistantMId:string)=>{

  try{
    if(!assistantMId){
      return { error: "Assistant Id is required" };
    }

    const nowTs = getUnixTime(new Date());
      //update the assistant metadata
      const assistantUpdateMetadataResponse = await fetch(
        `${process.env.NEXT_PUBLIC_WEBSITE_URL}voicebot/dashboard/api/phone/meta?assistantMId=${assistantMId}`,
        {
          method: "PUT",
          body: JSON.stringify({
            lastUsed: nowTs,
          })
        }
      );

      const parseResponse = await assistantUpdateMetadataResponse.json();
      console.log('assistantCreateData:', parseResponse);


  }
  catch(error:any){
      console.error('Error parsing request body:', error);
      return { message  : error };
  }

}

export const updateAssistantLastTrainedMetaDataService = async (assistantMId: string) => {

  try {
    if (!assistantMId) {
      return { error: "Assistant Id is required" };
    }

    const nowTs = getUnixTime(new Date());
    //update the assistant metadata
    const assistantUpdateMetadataResponse = await fetch(
      `${process.env.NEXT_PUBLIC_WEBSITE_URL}voicebot/dashboard/api/phone/meta?assistantMId=${assistantMId}`,
      {
        method: "PUT",
        body: JSON.stringify({
          lastTrained: nowTs,
        })
      }
    );

    const parseResponse = await assistantUpdateMetadataResponse.json();
    console.log('assistantCreateData:', parseResponse);
  }
  catch (error: any) {
    console.error('Error parsing request body:', error);
    return { message: error };
  }
}