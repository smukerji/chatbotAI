import { ObjectId } from "mongodb";

export type VoiceBotData = {
    assistantName: string;
    assistantTemplateIDs: ObjectId[];
    
    imageUrl:string;
    userId:ObjectId;
    
    vapiAssistantId:string;
    isDeleted:boolean;
}

export interface VoiceData{
    
assistantName: string,
assistantTemplateIDs: ObjectId[],

imageUrl:string,
userId:ObjectId,

vapiAssistantId:string,
isDeleted:boolean,
}
