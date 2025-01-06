// import { NextApiRequest, NextApiResponse } from "next";
import { NextResponse } from "next/server";
import clientPromise from "@/db";
import Stripe from "stripe";
import { ObjectId } from "mongodb";
import { apiHandler } from "@/app/_helpers/server/api/api-handler";
const stripe = new Stripe(String(process.env.NEXT_PUBLIC_STRIPE_SECRET_KEY));

module.exports = apiHandler({
  POST: getCustomer,
  PUT: getCustomerWhatsappDetails,
});

async function getCustomer(req: any, res: NextResponse) {
  if (req.method === "POST") {
    try {
      let { u_id } = await req.json();
      const db = (await clientPromise!).db();
      const collection = db.collection("users");
      const data = await collection.findOne({ _id: new ObjectId(u_id) });

      console.log("data.customerId", data.customerId === "");

      //ANCHOR - checking that user has customerId or not
      if (data?.customerId) {
        return { customerId: data.customerId };
      } else {
        //ANCHOR - create user's customerId
        const customer = await stripe.customers.create({
          email: data.email,
          name: data.username,
        });
        const add = await collection.updateOne(
          { _id: new ObjectId(u_id) },
          {
            $set: {
              customerId: customer.id,
            },
          }
        );
        return { message: "success", customerId: customer.id };
      }
    } catch (error) {
      console.error(error);
      return error;
      // res.status(500).json({ error: 'Unable to create subscription' });
    }
  } else {
    console.log("error");
  }
}

async function getCustomerWhatsappDetails(req: any, res: NextResponse) {
  try {
    let { u_id } = await req.json();
    const db = (await clientPromise!)?.db();
    const collection = db.collection("users");
    const data = await collection.findOne({ _id: new ObjectId(u_id) });
    const currentDate = new Date();
    if (data?.endDate > currentDate && data.plan != null) {
      return { msg: false };
    } else {
      return { msg: true };
    }
  } catch (error) {
    console.log(error);
  }
}
