import clientPromise from "../../../../db";
import { NextRequest, NextResponse } from "next/server";
import * as postmark from "postmark";
import { ServerClient } from "postmark";
import {
  contactUsBase64,
  logoBase64,
} from "../../../_helpers/emailImagesBase64Constants";

const client: postmark.ServerClient = new postmark.ServerClient(
  process.env.POST_MARK_TOKEN!
);

export async function POST(req: NextRequest) {
  const res = await req.json();
  if (
    res?.values?.name.trim() === "" ||
    res?.values?.email.trim() === "" ||
    res?.values?.mobile.trim() === "" ||
    res?.values?.message.trim() === ""
  ) {
    return NextResponse.json({
      message: "One or more required fields are empty",
      status: 400,
    });
  }

  if (res?.values?.email) {
    try {
      //---------------------- Send template email using Postmark
      await client.sendEmailWithTemplate({
        From: process.env.SENDERS_EMAIL!,
        To: res?.values?.email,
        TemplateAlias: "Thankyou-layout",
        MessageStream: "outbound",
        TemplateModel: {
          //   name: res?.values?.name,
        },
        Attachments: [
          {
            ContentID: "cid:part1.01030607.logo",
            ContentType: "image/png",
            Name: "luciferai-logo.png",
            Content: logoBase64,
          },
          {
            ContentID: "cid:part1.01030607.contactus-img",
            ContentType: "image/png",
            Name: "contact-us.png",
            Content: contactUsBase64,
          },
        ],
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
        contactedAt: timestamp, // Insert timestamp
      });

      return NextResponse.json({
        message: "Thank you for contacting us.",
        status: 200,
      });
    } catch (error) {
      // Handle error
      console.error("Error:", error);
      return NextResponse.json({ message: "Error occurred", status: 500 });
    }
  }
}
