import { apiHandler } from "@/app/_helpers/server/api/api-handler";
import clientPromise from "@/db";
import { ObjectId } from "mongodb";
import { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";

const msgSmall: any = process.env.NEXT_PUBLIC_MESSAGESMALL_PLAN_ID;
const msgLarge: any = process.env.NEXT_PUBLIC_MESSAGELARGE_PLAN_ID;
const onBoarding: any = process.env.NEXT_PUBLIC_ONBOARDING_FEES;
const trainingData: any = process.env.NEXT_PUBLIC_TRAINING_DATA_MONTHLY;

const stripeKey: any = process.env.NEXT_PUBLIC_STRIPE_SECRET_KEY;
const stripe = new Stripe(stripeKey);

// attach payment method to customer
const attachPaymentMethodToCustomer = async (
  customerId: string,
  paymentMethodId: string
) => {
  try {
    // Attach the payment method to the customer
    await stripe.paymentMethods.attach(paymentMethodId, {
      customer: customerId,
    });

    // Set the payment method as the default for future invoices
    await stripe.customers.update(customerId, {
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
    });
  } catch (error) {
    throw new Error(`Error attaching payment method: ${error}`);
  }
};

const addAddon = async (req: any, res: NextApiResponse) => {
  try {
    const { customerId, priceId, u_id, paymentMethodId } = req.json();

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

    await attachPaymentMethodToCustomer(customerId, paymentMethodId);

    // If the add-on is a one-off purchase, create a new invoice
    if (isOneOff) {
      // console.log("Processing one-off purchase. Creating new invoice...");
      let paidInvoice: any;

      for (let price of priceId) {
        // Create the invoice item (one-off addon)
        // Create the invoice for the customer

        const invoice = await stripe.invoices.create({
          customer: customerId,
          auto_advance: false, // We will finalize it manually
          default_payment_method: paymentMethodId,
        });

        const invoiceItem = await stripe.invoiceItems.create({
          customer: customerId,
          price: price,
          quantity: 1, // Modify this if needed
          invoice: invoice.id,
        });

        // Finalize the invoice to make it ready for payment
        const finalizedInvoice = await stripe.invoices.finalizeInvoice(
          invoice.id
        );

        // Pay the invoice immediately to charge the customer
        paidInvoice = await stripe.invoices.pay(invoice.id);
      }
      if (paidInvoice.status === "paid") {
        return {
          code: "addon_added",
          subscriptionId: subscriptionId,
          invoice: paidInvoice.id,
          createDate: paidInvoice.status_transitions.finalized_at,
          paymentIntentStatus: paidInvoice.status,
          isOneOff: isOneOff,
          parentFound: true,
        };
      } else {
        return {
          code: "addon_add_failed",
          subscriptionId: subscriptionId,
          isOneOff: isOneOff,
          parentFound: true,
        };
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
