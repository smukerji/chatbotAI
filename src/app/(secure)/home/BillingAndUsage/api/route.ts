import { NextResponse } from 'next/server';
import clientPromise from '@/db';
import Stripe from 'stripe';
import { apiHandler } from '@/app/_helpers/server/api/api-handler';
import { number } from 'joi';
import { ObjectId } from 'mongodb';
const stripe = new Stripe(String(process.env.NEXT_PUBLIC_STRIPE_SECRET_KEY));

module.exports = apiHandler({
  POST: getUserDetails,
  PUT: delPlan
});

async function getUserDetails(req: any, res: NextResponse) {
  try {
    const db = (await clientPromise!).db();
    let { u_id } = await req.json();
    const collectionUser = db.collection('users');
    const collectionPayment = db.collection('payment-history');
    const collectionPlan = db.collection('plans');
    const data = await collectionUser.findOne({ _id: new ObjectId(u_id) });
    const planId = data.planId;
    const data_plan = await collectionPlan.findOne({ _id: planId });

    const cursor = await collectionPayment.find({ userId: u_id });
    const paymentDetails = await cursor.toArray();

    /// close the cursor
    await cursor.close();
    return {
      plan: data.plan,
      nextRenewal: data.endDate,
      message: data_plan.messageLimit,
      chatbot: data_plan.numberOfChatbot,
      duration: data.duration,
      paymentDetails,
      status: data.status,
      whatsappIntegration: data.nextIsWhatsapp
    };
  } catch (error) {}
}

async function delPlan(req: any, res: NextResponse) {
  try {
    const db = (await clientPromise!)?.db();
    let { u_id, x } = await req.json();
    const collectionUser = db.collection('users');
    const collectionUserDetails = db.collection('user-details');
    const details = await collectionUserDetails.findOne({userId: u_id})
    const userData = await collectionUser.findOne({
      _id: new ObjectId(u_id)
    });
    if (x == 2) {
      //ANCHOR -  DELETE PLAN FROM USER DETAILS
      const subscription = await stripe.subscriptions.update(userData.subId, {
        cancel_at_period_end: true
        // prorate: true
      });
      if (userData.isWhatsapp == true) {
        const subscription = await stripe.subscriptions.update(userData.subIdWhatsapp, {
          // prorate: true
          cancel_at_period_end: true
        });
      }
      if(details.isTelegram == true){
        const subscription = await stripe.subscriptions.update(details.subIdTelegram, {
          // prorate: true
          cancel_at_period_end: true
        });
      }
      if(details.isSlack == true){
        const subscription = await stripe.subscriptions.update(details.subIdTelegram, {
          // prorate: true
          cancel_at_period_end: true
        });
      }
      const deletePlan = await collectionUser.updateMany(
        { _id: new ObjectId(u_id) },
        {
          $set: {
            status: 'cancel',
            nextIsWhatsapp: false
          }
        }
      );

      return { msg: 'Plan deleted successfully', status: true };
    }
    //ANCHOR - UPDATE WHATSAPP STATUS IN USERS
    else if (x == 1) {

      if (userData.isWhatsapp == true) {
        const subscription = await stripe.subscriptions.update(userData.subIdWhatsapp, {
          cancel_at_period_end: true
        });
      }
      const deleteAddOn = await collectionUser.updateMany(
        { _id: new ObjectId(u_id) },
        {
          $set: {
            nextIsWhatsapp: false
          }
        }
      );
      return { msg: 'Canceled whatsapp integration', status: true };
    }
  } catch (error) {
    return { msg: 'finding error', status: 0 };
  }
}
      // const deletePlan = await collectionUser.updateMany(
      //   { _id: new ObjectId(u_id) },
      //   {
      //     $set: {
      //       nextPlan: '',
      //       nextPlanId: '',
      //       nextPlanDuration: ''
      //     }
      //   }
      // );