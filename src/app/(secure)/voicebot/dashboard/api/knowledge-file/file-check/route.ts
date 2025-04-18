

import clientPromise from "../../../../../../../db";
import { ObjectId } from "mongodb";
import { NextRequest, NextResponse } from "next/server";
import { apiHandler } from "../../../../../../_helpers/server/api/api-handler";


module.exports = apiHandler({
    GET: checkSingleFileExistence,
});

async function checkSingleFileExistence(req: NextRequest) {
    try {
        const db = (await clientPromise!).db();
        const userFileKnowledge = db?.collection("user-file-knowledge"); // Change to your collection name

        const fileId = req.nextUrl.searchParams.get("fileId") as string;
        const userId = req.nextUrl.searchParams.get("userId") as string;

        const fileData = await userFileKnowledge?.findOne({ userId: new ObjectId(userId), "fileData.id": fileId });

        if (fileData) {
            return { message: 'File exists', status: 200 };
        } else {
            return { message: 'File does not exist', status: 404 };
        }
    } catch (error: any) {
        console.error('Error checking file existence:', error);
        if (error.body) {
            return { message: error.body };
        }
        return { message: error, status: 500 };
    }
}