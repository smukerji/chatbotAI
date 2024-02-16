import { NextApiRequest, NextApiResponse } from "next";
import { NextResponse } from "next/server";
import { connectDatabase } from "@/db";

export async function GET(req: NextApiRequest, res: NextApiResponse) {
    try {
        const db = (await connectDatabase())?.db();
        const collection = db.collection("plans");
        const data = await collection.find().toArray()
        console.log(data)
        return NextResponse.json(data)
    }
    catch(error){
        console.log(error)
    }
}