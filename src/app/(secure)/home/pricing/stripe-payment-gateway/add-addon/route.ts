import { apiHandler } from "@/app/_helpers/server/api/api-handler";
import clientPromise from "@/db";
import { ObjectId } from "mongodb";
import { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";

const addAddon = async (req: any, res: NextApiResponse) => {
  const stripeKey: any = process.env.NEXT_PUBLIC_STRIPE_SECRET_KEY;
  try {
    const stripe = new Stripe(stripeKey);

    const { customerId, priceId, u_id } = req.json();

    const db = (await clientPromise!).db();
    const collection = db.collection("users");
    const collectionDetails = db.collection("user-details");
    const collectionPlan = db.collection("plans");

    const userData = await collection.findOne({ _id: new ObjectId(u_id) });

    const subscriptionId = userData?.subId;

    if (!subscriptionId) {
      return {
        msg: "Parent Subscription not found. Please, add parent subscription first",
      };
    }

    // console.log("customer id ", customerId);

    const pricePlans = priceId.map((price: string) => {
      return {
        price: price,
      };
    });

    const subscription: any = await stripe.subscriptions.update(
      subscriptionId,
      {
        items: pricePlans,
        proration_behavior: "create_prorations", // To calculate prorated amount
        expand: ["latest_invoice.payment_intent"],
        payment_behavior: "default_incomplete",
      }
    );

    const priceIds = pricePlans.map((plan: any) => plan.price);

    console.log("price plans", priceIds);
    // Optional but recommended
    // Save the subscription object or ID to your database

    // Send the subscription ID and a client secret that the
    // Stripe subscription API creates. The subscription ID
    // and client secret will be used to
    // complete the payment on the frontend later.

    // Get the PaymentIntent and its clientSecret
    const paymentIntent = subscription?.latest_invoice?.payment_intent;

    for (const planId of priceIds) {
      console.log(`Processing planId: ${planId}`);

      // if (!planData) {
      //   console.error(`Plan data not found for priceId: ${planId}`);
      //   continue;
      // }

      if (planId === process.env.NEXT_PUBLIC_WHATSAPP_PLAN_ID_MONTHLY) {
        console.log("should come inside this");

        await collection.updateOne(
          { customerId: customerId },
          {
            $set: {
              isWhatsapp: true,
              subIdWhatsapp: subscriptionId,
              nextIsWhatsapp: true,
            },
          }
        );
      } else if (planId === process.env.NEXT_PUBLIC_SLACK_PLAN_ID_MONTHLY) {
        await collectionDetails.updateMany(
          { userId: String(userData._id) },
          {
            $set: {
              isSlack: true,
              subIdSlack: subscriptionId,
            },
          }
        );
      } else if (planId === process.env.NEXT_PUBLIC_TELEGRAM_PLAN_ID_MONTHLY) {
        await collectionDetails.updateMany(
          { userId: String(userData._id) },
          {
            $set: {
              isTelegram: true,
              subIdTelegram: subscriptionId,
            },
          }
        );
      } else if (planId === process.env.NEXT_PUBLIC_MESSAGESMALL_PLAN_ID) {
        const planData = await collectionPlan.findOne({ priceId: planId });
        const Details = await collectionDetails.findOne({
          userId: String(userData._id),
        });

        await collectionDetails.updateMany(
          { userId: String(userData._id) },
          {
            $set: {
              messageLimit:
                Number(Details?.messageLimit) + (planData.messageLimit ?? 0),
            },
          }
        );
      } else if (planId === process.env.NEXT_PUBLIC_MESSAGELARGE_PLAN_ID) {
        const planData = await collectionPlan.findOne({ priceId: planId });
        const Details = await collectionDetails.findOne({
          userId: String(userData._id),
        });

        await collectionDetails.updateMany(
          { userId: String(userData._id) },
          {
            $set: {
              messageLimit:
                Number(Details?.messageLimit) +
                Number(planData.messageLimit ?? 0),
            },
          }
        );
      } else if (planId === process.env.NEXT_PUBLIC_TRAINING_DATA_MONTHLY) {
        const planData = await collectionPlan.findOne({ priceId: planId });

        const Details = await collectionDetails.findOne({
          userId: String(userData._id),
        });

        await collectionDetails.updateMany(
          { userId: String(userData._id) },
          {
            $set: {
              trainingDataLimit:
                Number(Details?.trainingDataLimit) +
                Number(planData.trainingDataLimit ?? 0),
            },
          }
        );
      } else if (planId === process.env.NEXT_PUBLIC_LEADS_MONTHLY) {
        const planData = await collectionPlan.findOne({ priceId: planId });

        const Details = await collectionDetails.findOne({
          userId: String(userData._id),
        });

        await collectionDetails.updateMany(
          { userId: String(userData._id) },
          {
            $set: {
              leads:
                planData.leads == "unlimited"
                  ? "unlimited"
                  : Number(Details?.leads) + Number(planData.leads ?? 0),
            },
          }
        );
      } else if (
        planId === process.env.NEXT_PUBLIC_CONVERSATION_HISTORY_MONTHLY
      ) {
        const planData = await collectionPlan.findOne({ priceId: planId });

        const Details = await collectionDetails.findOne({
          userId: String(userData._id),
        });

        await collectionDetails.updateMany(
          { userId: String(userData._id) },
          {
            $set: {
              conversationHistory:
                Number(Details?.conversationHistory) +
                Number(planData.conversationHistory ?? 0),
            },
          }
        );
      }
    }

    return {
      code: "addon_added",
      subscriptionId: subscription.id,
      price: subscription.items.data.reduce(
        (acc: any, current: any) => acc + current?.plan?.amount,
        0
      ),
      clientSecret: paymentIntent.client_secret,
      invoice: subscription.latest_invoice.id,
      createDate: subscription.start_date,
      paymentIntentStatus: paymentIntent.status,
    };
  } catch (e) {
    console.error(e);

    return {
      code: "addon_add_failed",
      error: e,
    };
  }
};

module.exports = apiHandler({
  POST: addAddon,
});
