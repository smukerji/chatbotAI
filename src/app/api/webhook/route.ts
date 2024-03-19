import { NextResponse } from 'next/server';
import clientPromise from '@/db';
import Stripe from 'stripe';
import { ObjectId } from 'mongodb';
const stripe = new Stripe(String(process.env.NEXT_PUBLIC_STRIPE_SECRET_KEY));
import express from 'express';
const app = express();

export async function POST(req: any, res: any) {
  if (req.method === 'POST') {
    const db = (await clientPromise!).db();
    const collection = db.collection('users');
    const collectionPlan = db.collection('plans');
    const collectionPayment = db.collection('payment-history');

    const sig = req.headers.get('stripe-signature');
    const endpointSecret = 'whsec_1846bb71690a6f8876922cd471237f8972a2cd00716f96c1aef7a2ed211c5c1c';

    let event;
    const body = await req.text();
    try {
      event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
    } catch (err) {
      console.error('Webhook signature verification failed.', err);
      return res.status(400).end();
    }
    console.log('✅ Success:', event.id);
    // Handle the event
    let plan
    let planData;
    let date
    switch (event.type) {
      case 'customer.subscription.created':
        console.log('Checkout session completed:', event.data.object);
        date = new Date(event.data.object.current_period_end * 1000);
        if (event.data.object.plan.interval == 'month') {
          planData = await collectionPlan.findOne({ planIdMonth: event.data.object.plan.id });

        } else {
          planData = await collectionPlan.findOne({ planIdYear: event.data.object.plan.id });
        }
        plan = planData.name;
        await collection.updateOne(
          { customerId: event.data.object.customer },
          {
            $set: {
              subId: event.data.object.id,
              stripePlanId: event.data.object.plan.id,
              duration: event.data.object.plan.interval,
              endDate: date,
              plan,
              planId: planData._id
            }
          }
        );
        break;
      case 'customer.subscription.updated':
        console.log('Checkout session completed:', event.data.object);
        planData;
        date = new Date(event.data.object.current_period_end * 1000);
        if (event.data.object.plan.interval == 'month') {
          planData = await collectionPlan.findOne({ planIdMonth: event.data.object.plan.id });
        } else {
          planData = await collectionPlan.findOne({ planIdYear: event.data.object.plan.id });
        }
        plan = planData.name;
        await collection.updateOne(
          { customerId: event.data.object.customer },
          {
            $set: {
              subId: event.data.object.id,
              stripePlanId: event.data.object.plan.id,
              duration: event.data.object.plan.interval,
              endDate: date,
              plan,
              planId: planData._id
            }
          }
        );
        break;
      case 'invoice.paid':
        console.log('Invoice paid:', event.data.object);
        await collection.updateOne(
          { customerId: event.data.object.customer },
          {
            $set: {
              status: 'active'
            }
          }
        );
        break;
      default:
        console.warn('Unhandled event type:', event.type);
    }

    // Return a response to acknowledge receipt of the event
    return NextResponse.json({ received: true });
  }

  // Respond to other HTTP methods
  res.setHeader('Allow', ['POST']);
  return `Method ${req.method} Not Allowed`;
}
