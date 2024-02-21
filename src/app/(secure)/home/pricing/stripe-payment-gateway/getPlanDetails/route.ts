import { NextRequest, NextResponse } from "next/server";
import { connectDatabase } from "@/db";
import { ObjectId } from "mongodb";

//ANCHOR - getting all plan details
export async function GET(req: NextRequest, res: NextResponse) {
    try {
        const db = (await connectDatabase())?.db();
        const collection = db.collection("plans");
        const data = await collection.find().toArray()
        return NextResponse.json(data)
    }
    catch(error){
       return NextResponse.json(error)
    }
}
//ANCHOR - checking that user has payment-methodId or not
export async function POST(req: any, res: NextResponse) {

    let {u_id} = await req.json();
    const db = (await connectDatabase())?.db();
    const collection = db.collection("users");
    const user = await collection.findOne({ _id: new ObjectId(u_id) });
    const h = user.paymentId;
  
    //ANCHOR - check that paymentId available or not
    if (h != undefined) {
      return NextResponse.json("success");
    } else {
      return NextResponse.json({ status: 500 });
    }
  }