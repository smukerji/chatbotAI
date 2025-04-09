import { NextRequest, NextResponse } from "next/server";
import { apiHandler } from "../../../../../_helpers/server/api/api-handler";
import { generateAndGetToken } from "../../services/vapi-services";

module.exports = apiHandler({

    POST: getVapiToken,
});

async function getVapiToken(req: NextRequest) {

    try {
        const token = await generateAndGetToken();
        return {token}
    }
    catch(error:any){
        console.error('Error parsing request body:', error);
        if(error.body){
            return { message: error.body }
        }
        return { message: error };
    }

}
