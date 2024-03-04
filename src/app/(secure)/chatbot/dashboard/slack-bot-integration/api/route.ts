import { NextRequest, NextResponse } from "next/server";
import { apiHandler } from "../../../../../_helpers/server/api/api-handler";
import{connectDatabase} from '../../../../../../db';

module.exports = apiHandler({
    POST: saveSlackAppData,
  });

interface SlackAppData {
    
}

async function saveSlackAppData(req:NextRequest){
    let slackAppData:SlackAppData = await req.json();
}