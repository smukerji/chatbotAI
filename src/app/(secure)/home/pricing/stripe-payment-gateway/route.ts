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
      let planData;
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
        let name;
        let planID;
        if (plan == 6) {
          name = 'MessageSmall';
          planData = await collectionPlan.findOne({ name: name });
          planID = planData.planId;
        }
        if (plan == 7) {
          name = 'MessageLarge';
          planData = await collectionPlan.findOne({ name: name });
          planID = planData.planId;
        }
        if (plan == 5) {
          name = 'Character';
          planData = await collectionPlan.findOne({ name: name });
          planID = planData.planId;
        }
        if (plan == 8) {
          name = 'WhatsApp';
          planData = await collectionPlan.findOne({ name: name });
          planID = planData.planId;
        }
        if (plan == 9) {
          name = 'Slack';
          planData = await collectionPlan.findOne({ name: name });
          planID = planData.planId;
        }
        if (plan == 10) {
          name = 'Telegram';
          planData = await collectionPlan.findOne({ name: name });
          planID = planData.planIdMonth;
        }

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
        let subscription: any;
        if (data.status == 'active' && (plan == 2 || plan == 4)) {
          const subscriptionId = await stripe.subscriptions.retrieve(data.subId);
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
        } else {
          if (plan == 5 || plan == 6 || plan == 7) {
            subscription = await stripe.subscriptions.create({
              customer: data.customerId,
              default_payment_method: data.paymentId,
              off_session: true,
              cancel_at_period_end: true,
              items: [
                {
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
          }
        }
        if (isWhatsapp == true) {
          let name = 'WhatsApp';
          planData = await collectionPlan.findOne({ name: name });
          let plan_ID = planData.planId;
          subscription = await stripe.subscriptions.create({
            customer: data.customerId,
            default_payment_method: data.paymentId,
            off_session: true,
            // cancel_at_period_end: true,
            items: [
              {
                plan: plan_ID
              }
            ]
          });
        } else if (isWhatsapp == false && !data.subIdWhatsapp) {
          await collection.updateOne(
            { customerId: subscription.customer },
            {
              $set: {
                isWhatsapp: false
              }
            }
          );
        }
        if (isSlack == true) {
          name = 'Slack';
          planData = await collectionPlan.findOne({ name: name });
          let plan_ID = planData.planId;
          subscription = await stripe.subscriptions.create({
            customer: data.customerId,
            default_payment_method: data.paymentId,
            off_session: true,
            // cancel_at_period_end: true,
            items: [
              {
                plan: plan_ID
              }
            ]
          });
        }

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

