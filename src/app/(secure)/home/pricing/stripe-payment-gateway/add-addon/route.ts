import { apiHandler } from "@/app/_helpers/server/api/api-handler";
import clientPromise from "@/db";
import { ObjectId } from "mongodb";
import { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";

const msgSmall: any = process.env.NEXT_PUBLIC_MESSAGESMALL_PLAN_ID;
const msgLarge: any = process.env.NEXT_PUBLIC_MESSAGELARGE_PLAN_ID;
const onBoarding: any = process.env.NEXT_PUBLIC_ONBOARDING_FEES;
const trainingData: any = process.env.NEXT_PUBLIC_TRAINING_DATA_MONTHLY;

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
        parentFound: false,
      };
    }

    // console.log("customer id ", customerId);

    const pricePlans = priceId.map((price: string) => {
      return {
        price: price,
      };
    });

    // Separate one-off purchases and recurring add-ons
    const oneOffAddons = [msgSmall, msgLarge, onBoarding, trainingData];
    const isOneOff = priceId.some((id: string) => oneOffAddons.includes(id));

    let paymentIntent;
    let subscription: any;
    let invoice: any;

    // If the add-on is a one-off purchase, create a new invoice
    if (isOneOff) {
      // console.log("Processing one-off purchase. Creating new invoice...");

      for (let price of priceId) {
        console.log("priceee", price, customerId);

        subscription = await stripe.invoiceItems.create({
          customer: customerId,
          price: price, // Assuming a single one-off item
          // expand: ["latest_invoice.payment_intent"],
        });

        // Create an invoice immediately for one-off purchases
        const invoice: any = await stripe.invoices.create({
          customer: customerId,
          collection_method: "charge_automatically", // Automatic charge when finalized
          auto_advance: true,
        });

        console.log("subscriptiosssss", subscription);

        // Finalize the invoice to trigger payment
        const finalizedInvoice: any = await stripe.invoices.finalizeInvoice(
          invoice.id
        );

        console.log("invoice>>>", finalizedInvoice);
        // paymentIntent = await stripe.paymentIntents.create({
        //   amount: subscription.amount,
        //   currency: subscription.currency,
        //   // automatic_payment_methods: { enabled: true },
        //   confirmation_method: "automatic",
        // });

        // console.log("invoiceItem", paymentIntent, ">>>>>", finalizedInvoice);
        if (finalizedInvoice) {
          return {
            code: "addon_added",
            clientSecret: finalizedInvoice.client_secret,
            invoice: finalizedInvoice.id,
            paymentIntentStatus: finalizedInvoice.status,
            isOneOff: true,
            parentFound: true,
          };
        } else {
          return {
            code: "invoice_pending",
            msg: "Invoice created but no payment intent available",
          };
        }
      }
    } else {
      subscription = await stripe.subscriptions.update(subscriptionId, {
        items: pricePlans,
        proration_behavior: "create_prorations", // To calculate prorated amount
        expand: ["latest_invoice.payment_intent"],
        payment_behavior: "default_incomplete",
      });
      paymentIntent = subscription?.latest_invoice?.payment_intent;
    }
    const priceIds = pricePlans.map((plan: any) => plan.price);

    // Optional but recommended
    // Save the subscription object or ID to your database

    // Send the subscription ID and a client secret that the
    // Stripe subscription API creates. The subscription ID
    // and client secret will be used to
    // complete the payment on the frontend later.

    // Get the PaymentIntent and its clientSecret

    // update the database
    for (const planId of priceIds) {
      if (planId === process.env.NEXT_PUBLIC_WHATSAPP_PLAN_ID_MONTHLY) {
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
                Number(Details?.messageLimit) + (planData?.messageLimit ?? 0),
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
      subscriptionId: subscription?.id,
      price: subscription?.items?.data?.reduce(
        (acc: any, current: any) => acc + current?.plan?.amount,
        0
      ),
      clientSecret: paymentIntent?.client_secret,
      invoice: subscription?.latest_invoice?.id
        ? subscription?.latest_invoice?.id
        : paymentIntent?.id,
      createDate: subscription?.start_date,
      paymentIntentStatus: paymentIntent?.status,
      isOneOff: isOneOff,
      parentFound: true,
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
