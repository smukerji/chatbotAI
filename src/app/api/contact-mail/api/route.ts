import { NextRequest, NextResponse } from "next/server";
import * as postmark from 'postmark';
import { ServerClient } from 'postmark'; 


const client:any = new postmark.ServerClient(process.env.POST_MARK_TOKEN!);

export async function POST(req: NextRequest) {
    try {
        // const { to, templateId, templateModel } = req.body; // Assuming you pass 'to', 'templateId', and 'templateModel' in the request body

        // Send template email using Postmark
        await client.sendEmailWithTemplate({
            From: "",
            To: "",
            TemplateAlias: "",
             MessageStream: "",
             TemplateModel:{
                "name":""
             }
        });

        return NextResponse.json({ message: 'Email sent successfully', status: 200 });
    } catch (error) {
        console.error('Error sending email:', error);
        return NextResponse.json({ message: 'Failed to send email', status: 500 });
    }
}