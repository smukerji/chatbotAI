import clientPromise from "../../../../db";
import { NextRequest, NextResponse } from "next/server";
import * as postmark from 'postmark';
import { ServerClient } from 'postmark'; 


const client:any = new postmark.ServerClient(process.env.POST_MARK_TOKEN!);

export async function POST(req: NextRequest) {
    
        const res =await req.json()
        if (res?.values?.name.trim() === '' || res?.values?.email.trim() === '' || res?.values?.mobile.trim() === '' || res?.values?.message.trim() === '') {
            return NextResponse.json({ message: 'One or more required fields are empty', status: 400 });
        }
        
        if(res?.values?.email){

            try {
                //---------------------- Send template email using Postmark
                await client.sendEmailWithTemplate({
                    From: process.env.SENDERS_EMAIL,
                    To: res?.values?.email,
                    TemplateAlias: "Thankyou-layout",
                    MessageStream: "outbound",
                    TemplateModel: {
                        "name": res?.values?.name
                    }
                });
        
                //---------------------- Insert values into the database with timestamp
                const timestamp = new Date(); // Generate timestamp
        
                const db = (await clientPromise!).db();
                const collection = db.collection("contact-details");
                const result = await collection.insertOne({
                    name: res?.values?.name,
                    email: res?.values?.email,
                    mobile: res?.values?.mobile,
                    message: res?.values?.message,
                    contactedAt: timestamp // Insert timestamp
                });
        
                return NextResponse.json({ message: 'Email sent successfully', status: 200 });
            } catch (error) {
                // Handle error
                console.error("Error:", error);
                return NextResponse.json({ message: 'Error occurred', status: 500 });
            }
        }


   
}