import { NextRequest, NextResponse } from "next/server";
import { apiHandler } from "../../../../../_helpers/server/api/api-handler";
import clientPromise from "../../../../../../db";
import { ObjectId } from "mongodb";

module.exports = apiHandler({
    // GET: getAssistantList,//dashboard/api/assistant
    // DELETE:deleteSingleAssistant//dashboard/api/assistant
    POST: importNumberToTwilio,
});
// voicebot/dashboard/api/phone
async function importNumberToTwilio(req: NextRequest) {
    try {
        const data = await req.json();
        console.log('Received data:', data);
        return NextResponse.json({ message: 'Data received successfully' });
    } catch (error) {
        console.error('Error parsing request body:', error);
        return NextResponse.json({ message: 'Error parsing request body' }, { status: 400 });
    }
}


