import { NextResponse } from 'next/server';
import clientPromise from '@/db';
import { Stripe as s } from 'stripe';
import { ObjectId } from 'mongodb';
import { apiHandler } from '@/app/_helpers/server/api/api-handler';
import { Card } from 'antd';
const stripe = new s(String(process.env.NEXT_PUBLIC_STRIPE_SECRET_KEY));
import express from 'express';
const app = express();

module.exports = apiHandler({
  POST: createPaymentIntent,
  PUT: checkCurrentPlan
});

async function createPaymentIntent(req: any, res: NextResponse) {
  if (req.method === 'POST') {
    try {
      const db = (await clientPromise!).db();
      let planData
      let { plan, price, u_id, isWhatsapp, isSlack } = await req.json();
      const collection = db.collection('users');
      const collectionPlan = db.collection('plans');
      const data = await collection.findOne({ _id: new ObjectId(u_id) });
      let currentDate = new Date();
      //ANCHOR - checking existing plan of user
      if (data.plan == 'individual' && data.endDate > currentDate && plan == 1 && plan == 3) {
        return 'You already have plan';
      }

      const paymentMethod = data.paymentId;
      if (paymentMethod) {
        let planID;
        if (plan == 6) {
          planID = 'plan_PlVDfwvIk4Rq64';
        }
        if (plan == 7) {
          planID = 'plan_PlVD6HvJjRARCd';
        }
        if (plan == 5) {
          planID = 'plan_PlVDnbgUmFjlrB';
        }
        if (plan == 8) {
          planID = 'plan_PlVD83jK9SUwwM';
        }
        if (plan == 9) {
          planID = 'plan_PlVDDEMmnGFxiX';
        }

        let name;
        if (plan == 1 || plan == 3) {
          name = 'individual';
        }
        if (plan == 2 || plan == 4) {
          name = 'agency';
        }
        if (plan == 1 || plan == 2) {
          planData = await collectionPlan.findOne({ name: name });
          planID = planData.planIdMonth;
        }
        if (plan == 3 || plan == 4) {
          planData = await collectionPlan.findOne({ name: name });
          planID = planData.planIdYear;
        }
        let subscription;
        if (data.status == 'active' && (plan == 2 || plan == 4)) {
          const subscriptionId = await stripe.subscriptions.retrieve(data.subId);
          console.log(subscriptionId.items.data[0].id, data.subId);
          subscription = await stripe.subscriptions.update(data.subId, {
            proration_behavior: 'always_invoice',
            off_session: true,
            items: [
              {
                id: subscriptionId.items.data[0].id,
                plan: planID
              }
            ]
          });
        } else {
          subscription = await stripe.subscriptions.create({
            customer: data.customerId,
            default_payment_method: data.paymentId,
            off_session: true,
            // cancel_at_period_end: true,
            items: [
              {
                plan: planID
              }
            ]
          });
          let date = new Date(subscription.current_period_end * 1000);
          await collection.updateOne(
            { customerId: subscription.customer },
            {
              $set: {
                subId: subscription.id,
                stripePlanId: subscription.plan.id,
                duration: subscription.plan.interval,
                endDate: date,
                plan: planData.name,
                planId: planData._id
              }
            }
          );
        }
        if(isWhatsapp == true){
          subscription = await stripe.subscriptions.create({
            customer: data.customerId,
            default_payment_method: data.paymentId,
            off_session: true,
            // cancel_at_period_end: true,
            items: [
              {
                plan: 'plan_PlVD83jK9SUwwM'
              }
            ]
          });
        }
        if(isSlack == true){
          subscription = await stripe.subscriptions.create({
            customer: data.customerId,
            default_payment_method: data.paymentId,
            off_session: true,
            // cancel_at_period_end: true,
            items: [
              {
                plan: 'plan_PlVDDEMmnGFxiX'
              }
            ]
          });
        }
        //ANCHOR - stripe payment intent creation
        // const paymentIntent = await stripe.paymentIntents.create({
        //   amount: amount,
        //   currency: "usd",
        //   automatic_payment_methods: {
        //     enabled: true,
        //   },
        //   customer: data.customerId,
        //   payment_method: data.paymentId,
        //   receipt_email: data.email,
        // });
        console.log(subscription);
        console.log(':::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::');
        return subscription;
      } else {
        return { status: 500 };
      }
    } catch (error) {
      console.error(error);
      return error;
    }
  } else {
    console.log('error');
  }
}

async function checkCurrentPlan(req: any, res: NextResponse) {
  let { u_id } = await req.json();
  const db = (await clientPromise!).db();
  const collection = db.collection('users');
  const collectionUserDetails = db.collection('user-details');
  const details = await collectionUserDetails.findOne({ userId: u_id });
  const data = await collection.findOne({ _id: new ObjectId(u_id) });
  let currentDate = new Date();
  const date2: any = new Date(data.endDate);
  const date1: any = new Date();

  const differenceMs = date2 - date1;
  const differenceDays = Math.round(differenceMs / (1000 * 60 * 60 * 24));
  //ANCHOR - check current plan of the user
  if (data.endDate > currentDate) {
    if (data.plan == 'individual') {
      return {
        msg: 1,
        prePrice: 15,
        duration: data.duration,
        text: 'Current Plan',
        whatsAppIntegration: data.isWhatsapp,
        slackIntegration: details.isSlack,
        telegramIntegration: details.isTelegram,
        hubspotIntegration: details.isHubspot
      };
    } else if (data.plan == 'agency') {
      return {
        msg: 2,
        duration: data.duration,
        text: 'Current Plan',
        whatsAppIntegration: data.isWhatsapp,
        slackIntegration: details.isSlack,
        telegramIntegration: details.isTelegram,
        hubspotIntegration: details.isHubspot
      };
    } else {
      return {
        msg: 1,
        prePrice: 0,
        duration: data.duration,
        text: `Trial Expiring in ${differenceDays} Days`,
        whatsAppIntegration: true,
        slackIntegration: true,
        telegramIntegration: true,
        hubspotIntegration: true
      };
    }
  } else {
    return {
      msg: 0,
      text: 'Get started',
      whatsAppIntegration: data.isWhatsapp
    };
  }
}
// let amount: number = price * 100;
// console.log(plan);
// const plan1 = await stripe.plans.create({
//   currency: 'INR',
//   interval: 'day',
//   product: 'prod_PjdBr09Yx1TH5c',
//   nickname: 'monthly heathly plan',
//   amount: 1500,
//   usage_type: 'licensed'
// });
// console.log(plan1)
// const plan2 = await stripe.plans.create({
//   currency: 'INR',
//   interval: 'month',
//   product: 'prod_PjdBjXgPn0lgah',
//   nickname: 'monthly heathly plan',
//   amount: 89,
//   usage_type: 'licensed'
// });
// const plan3 = await stripe.plans.create({
//   currency: 'INR',
//   interval: 'year',
//   product: 'prod_PjdBr09Yx1TH5c',
//   nickname: 'monthly heathly plan',
//   amount: 144,
//   usage_type: 'licensed'
// });
// const plan4 = await stripe.plans.create({
//   currency: 'INR',
//   interval: 'year',
//   product: 'prod_PjdBjXgPn0lgah',
//   nickname: 'monthly heathly plan',
//   amount: 854,
//   usage_type: 'licensed'
// // });
// const prod1 = await stripe.products.create({
//   name: 'message add ons',
// });
// const prod2 = await stripe.products.create({
//   name: 'message add ons',
// });
// const prod3 = await stripe.products.create({
//   name: 'character add on',
// });
// const prod4 = await stripe.products.create({
//   name: 'whats app integration',
// });
// const prod5 = await stripe.products.create({
//   name: 'slack integration',
// });
// const plan1 = await stripe.plans.create({
//   currency: 'INR',
//   interval: 'month',
//   nickname: 'messageAddOn',
//   product:  prod1.id,
//   amount: 500,
//   usage_type: 'licensed'
// });
// console.log(plan1);
// const plan2 = await stripe.plans.create({
//   currency: 'INR',
//   interval: 'month',
//   nickname: 'messageAddOnLarge',
//   product:  prod2.id,
//   amount: 800,
//   usage_type: 'licensed'
// });
// const plan3 = await stripe.plans.create({
//   currency: 'INR',
//   interval: 'month',
//   nickname: 'CharacterAddOn',
//   product:  prod3.id,
//   amount: 500,
//   usage_type: 'licensed'
// });
// const plan4 = await stripe.plans.create({
//   currency: 'INR',
//   interval: 'month',
//   nickname: 'WhatsApp',
//   product:  prod4.id,
//   amount: 700,
//   usage_type: 'licensed'
// });
// const plan5 = await stripe.plans.create({
//   currency: 'INR',
//   interval: 'month',
//   nickname: 'Slack',
//   product:  prod5.id,
//   amount: 700,
//   usage_type: 'licensed'
// });
// console.log('>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>');
// console.log(plan1, plan2, plan3, plan4, plan5);
