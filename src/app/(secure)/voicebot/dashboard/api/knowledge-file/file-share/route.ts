

import clientPromise from "../../../../../../../db";
import { ObjectId } from "mongodb";
import { NextRequest, NextResponse } from "next/server";
import { apiHandler } from "../../../../../../_helpers/server/api/api-handler";


module.exports = apiHandler({
  GET: checkSingleFileShared,
});

async function checkSingleFileShared(req: NextRequest) {
  try {
    const db = (await clientPromise!).db();
    const userFileKnowledge = db?.collection("user-file-knowledge"); // Change to your collection name

    const fileId = req.nextUrl.searchParams.get("fileId") as string;

    const fileData = await userFileKnowledge?.find({ "fileData.id": fileId }).toArray();
    if (fileData.length >= 2) {
      return { message: 'File Shared',file:true, status: 200 };
    } else {
      return { message: 'File does not Shared',file:false, status: 200 };
    }
  } catch (error: any) {
    console.error('Error checking file existence:', error);
    if (error.body) {
      return { message: error.body };
    }
    return { message: error, status: 500 };
  }
}