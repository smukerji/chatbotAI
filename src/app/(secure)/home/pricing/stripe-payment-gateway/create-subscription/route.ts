import { apiHandler } from "@/app/_helpers/server/api/api-handler";
import clientPromise from "@/db";
import { ObjectId } from "mongodb";
import { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";

const stripeKey: any = process.env.NEXT_PUBLIC_STRIPE_SECRET_KEY;
const stripe = new Stripe(stripeKey);

const businessPlanMonthly = process.env.NEXT_PUBLIC_BUSINESS_PLAN_MONTHLY;
const businessPlanYearly = process.env.NEXT_PUBLIC_BUSINESS_PLAN_YEARLY;
const individualPlanMonthly = process.env.NEXT_PUBLIC_INDIVIDUAL_PLAN_MONTHLY;
const individualPlanYearly = process.env.NEXT_PUBLIC_INDIVIDUAL_PLAN_YEARLY;
const starterPlanMonthly = process.env.NEXT_PUBLIC_STARTER_PLAN_MONTHLY;
const starterPlanYearly = process.env.NEXT_PUBLIC_STARTER_PLAN_YEARLY;

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

const createSubscription = async (req: any, res: NextApiResponse) => {
  try {
    const { customerId, priceId, u_id, paymentMethodId } = req.json();

    const db = (await clientPromise!).db();
    const collection = db.collection("users");
    const data = await collection.findOne({ _id: new ObjectId(u_id) });

    const subId = data.subId;

    if (subId) {
      const existingSubscription = await stripe.subscriptions.retrieve(subId);
      const currentPlanId = existingSubscription.items.data[0].price.id;

      console.log("current plan id", currentPlanId, existingSubscription);

      let isUpgrade = false;
      let prorationBehavior: any = "create_prorations";
      let updateNow = true;

      if (priceId.length > 1) {
        return {
          msg: "While doing upgrade, you can only change main plan. Not addons.",
        };
      }

      const mainPlanId = priceId[0];

      // Upgrade logic based on plan and duration (monthly/yearly)
      if (
        (currentPlanId == starterPlanMonthly &&
          (mainPlanId == individualPlanMonthly ||
            mainPlanId == businessPlanMonthly)) ||
        (currentPlanId == starterPlanYearly &&
          (mainPlanId == individualPlanYearly ||
            mainPlanId == businessPlanYearly)) ||
        (currentPlanId == individualPlanMonthly &&
          mainPlanId == businessPlanMonthly) ||
        (currentPlanId == individualPlanYearly &&
          mainPlanId == businessPlanYearly)
      ) {
        console.log("coming in upgrade sectionnnnnnnnnnnnnnnnnn");

        isUpgrade = true;
      }
      // Downgrade logic (no proration, takes effect next cycle)
      else if (
        (currentPlanId == businessPlanMonthly &&
          (mainPlanId == individualPlanMonthly ||
            mainPlanId == starterPlanMonthly)) ||
        (currentPlanId == businessPlanYearly &&
          (mainPlanId == individualPlanYearly ||
            mainPlanId == starterPlanYearly)) ||
        (currentPlanId == individualPlanMonthly &&
          mainPlanId == starterPlanMonthly) ||
        (currentPlanId == individualPlanYearly &&
          mainPlanId == starterPlanYearly)
      ) {
        console.log("dddddddowwwwwnnnnnnnnn gradeeeeeee");

        prorationBehavior = "none"; // No proration for downgrades
        updateNow = false; // We will update at the next cycle, not now
      }
      await attachPaymentMethodToCustomer(customerId, paymentMethodId);

      // -----------------------------------Update the subscription with the new plan--------------------------------------------------
      let updatedSubscription: any;
      if (updateNow) {
        updatedSubscription = await stripe.subscriptions.update(subId, {
          items: [
            {
              id: existingSubscription?.items?.data[0]?.id,
              price: mainPlanId,
            },
          ],
          proration_behavior: prorationBehavior,
          expand: ["latest_invoice.payment_intent"],
        });
      } else {
        const schedule = await stripe.subscriptionSchedules.create({
          // from_subscription: subId, // Link to the current active subscription
          customer: customerId,
          end_behavior: "release", // Keep the subscription active after the schedule ends
          start_date: existingSubscription.current_period_end, // Schedule the downgrade for the next billing cycle
          phases: [
            {
              items: [
                {
                  price: mainPlanId, // Downgrade plan ID
                  quantity: 1,
                },
              ],
              proration_behavior: "none", // No proration for downgrades
            },
          ],
        });

        // Handle the response for deferred downgrades
        return {
          code: "downgrade_scheduled",
          subscriptionId: schedule.id,
          msg: "Downgrade scheduled for the next billing cycle.",
        };
      }

      const paymentIntent = updatedSubscription?.latest_invoice?.payment_intent;

      // If the subscription is an upgrade, create and pay the proration invoice immediately
      if (isUpgrade) {
        // Create an invoice for the proration amount
        const invoice = await stripe.invoices.create({
          customer: customerId,
          subscription: updatedSubscription.id,
          auto_advance: true, // Automatically finalizes the invoice
          default_payment_method: paymentMethodId,
        });

        // Finalize and pay the invoice immediately
        await stripe.invoices.pay(invoice.id);

        // Return success with proration details
        return {
          code: "upgrade_completed",
          subscriptionId: updatedSubscription.id,
          invoiceId: invoice.id,
          prorationAmount: invoice.total / 100,
          msg: "Subscription upgraded and prorated amount charged.",
          paymentIntentStatus: paymentIntent.status,
        };
      }

      // Handle incomplete payment scenarios
      if (
        paymentIntent?.status === "requires_payment_method" ||
        paymentIntent?.status === "requires_action" ||
        paymentIntent?.status === "incomplete"
      ) {
        return {
          code: "payment_incomplete",
          clientSecret: paymentIntent?.client_secret,
          subscriptionId: updatedSubscription?.id,
          invoiceId: updatedSubscription?.latest_invoice?.id,
          msg: "Payment is incomplete. Please complete the payment.",
          paymentIntentStatus: paymentIntent?.status,
        };
      }

      return {
        code: "subscription_updated",
        subscriptionId: updatedSubscription?.id,
        price: updatedSubscription?.items?.data?.reduce(
          (acc: any, current: any) => acc + current?.plan?.amount,
          0
        ),
        clientSecret: paymentIntent?.client_secret,
        invoice: updatedSubscription?.latest_invoice?.id,
        createDate: updatedSubscription?.start_date,
        paymentIntentStatus: paymentIntent?.status,
      };
    }

    //---------------------------------- If no existing subscription, create a new one---------------------------------------

    // Attach the payment method to the customer
    await attachPaymentMethodToCustomer(customerId, paymentMethodId);

    const pricePlans = priceId.map((price: string) => {
      return {
        price: price,
      };
    });

    const subscription: any = await stripe.subscriptions.create({
      customer: customerId,
      items: pricePlans,
      payment_behavior: "default_incomplete",
      expand: ["latest_invoice.payment_intent"],
    });

    // Get the PaymentIntent and its clientSecret
    const paymentIntent = subscription?.latest_invoice?.payment_intent;

    return {
      code: "subscription_created",
      subscriptionId: subscription.id,
      price: subscription.items.data.reduce(
        (acc: any, current: any) => acc + current?.plan?.amount,
        0
      ),
      clientSecret: paymentIntent.client_secret,
      invoice: subscription.latest_invoice.id,
      createDate: subscription.start_date,
      alreadyExist: false,
      paymentIntentStatus: paymentIntent.status,
    };
  } catch (e) {
    console.error(e);

    return {
      code: "subscription_creation_failed",
      error: e,
    };
  }
};

module.exports = apiHandler({
  POST: createSubscription,
});
