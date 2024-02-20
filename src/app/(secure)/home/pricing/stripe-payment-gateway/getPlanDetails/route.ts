import { NextRequest, NextResponse } from "next/server";
import { connectDatabase } from "@/db";
import { ObjectId } from "mongodb";

export async function GET(req: NextRequest, res: NextResponse) {
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
//ANCHOR - checking that user has payment-methodId or not
export async function POST(req: any, res: NextResponse) {

    let {u_id} = await req.json();
    console.log('[Symbol]....................',u_id)
    const db = (await connectDatabase())?.db();
    const collection = db.collection("users");
    // let userId = "65c07a9dd73744ba62c1ea14";
    const user = await collection.findOne({ _id: new ObjectId(u_id) });
    console.log(user)
    const h = user.paymentId;
  
    //ANCHOR - check that paymentId available or not
    if (h != undefined) {
      return NextResponse.json("success");
    } else {
      return NextResponse.json({ status: 500 });
    }
  }