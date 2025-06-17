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

const whatsappMonthly = process.env.NEXT_PUBLIC_WHATSAPP_PLAN_ID_MONTHLY;
const whatsappYearly = process.env.NEXT_PUBLIC_WHATSAPP_PLAN_ID_YEARLY;
const telegramMonthly = process.env.NEXT_PUBLIC_TELEGRAM_PLAN_ID_MONTHLY;
const telegramYearly = process.env.NEXT_PUBLIC_TELEGRAM_PLAN_ID_YEARLY;

// attach payment method to customer
const attachPaymentMethodToCustomer = async (
  customerId: string,
  paymentMethodId: string
) => {
  try {
    // Retrieve the list of payment methods for the customer
    const existingPaymentMethods = await stripe.paymentMethods.list({
      customer: customerId,
      type: "card",
    });

    // Retrieve the new payment method details
    const newPaymentMethod = await stripe.paymentMethods.retrieve(
      paymentMethodId
    );

    // Check if the card fingerprint already exists
    const matchingPaymentMethod = existingPaymentMethods.data.find(
      (pm) => pm.card?.fingerprint === newPaymentMethod.card?.fingerprint
    );

    if (matchingPaymentMethod) {
      // Set the existing payment method as the default for future invoices
      await stripe.customers.update(customerId, {
        invoice_settings: {
          default_payment_method: matchingPaymentMethod.id,
        },
      });

      return matchingPaymentMethod.id;
    } else {
      // Attach the new payment method to the customer
      await stripe.paymentMethods.attach(paymentMethodId, {
        customer: customerId,
      });

      // Set the new payment method as the default for future invoices
      await stripe.customers.update(customerId, {
        invoice_settings: {
          default_payment_method: paymentMethodId,
        },
      });

      return paymentMethodId;
    }
  } catch (error) {
    throw new Error(`Error attaching payment method: ${error}`);
  }
};

const createSubscriptionHandler = async (
  customerId: string,
  paymentMethodId: string,
  priceId: string[]
) => {
  //---------------------------------- If no existing subscription, create a new one---------------------------------------

  // Attach the payment method to the customer
  await attachPaymentMethodToCustomer(customerId, paymentMethodId);

  const pricePlans: any = priceId.map((price: string) => {
    return {
      price: price,
    };
  });

  // Check if the business plan (monthly or yearly) is selected and add WhatsApp and Telegram as free add-ons
  if (
    priceId.includes(businessPlanMonthly!) ||
    priceId.includes(businessPlanYearly!)
  ) {
    const whatsappPlan = priceId.includes(businessPlanMonthly!)
      ? whatsappMonthly!
      : whatsappYearly!;
    const telegramPlan = priceId.includes(businessPlanMonthly!)
      ? telegramMonthly!
      : telegramYearly!;

    // Add WhatsApp and Telegram as free add-ons by setting quantity to 0
    pricePlans.push(
      { price: whatsappPlan, quantity: 0 },
      { price: telegramPlan, quantity: 0 }
    );
  }

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
      /// check if the subscription is active is already cancelled create a new subscription
      if (
        existingSubscription.status === "canceled" ||
        existingSubscription.status === "incomplete_expired"
      ) {
        return await createSubscriptionHandler(
          customerId,
          paymentMethodId,
          priceId
        );
      }

      const currentPlanId = existingSubscription.items.data[0].price.id;

      let isUpgrade = false;
      let prorationBehavior: any = "create_prorations";
      let updateNow = true;

      if (priceId.length > 1) {
        return {
          msg: "While doing upgrade, you can only change main plan. Not addons.",
        };
      }

      // if already a downgrade is scheduled then don't allow for another downgrade
      if (existingSubscription.schedule) {
        return {
          code: "schedule_exists",
          msg: "A subscription schedule is already in place. You cannot schedule another downgrade.",
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
        prorationBehavior = "none"; // No proration for downgrades
        updateNow = false; // We will update at the next cycle, not now
      }
      const defaultPaymentId = await attachPaymentMethodToCustomer(
        customerId,
        paymentMethodId
      );

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
          cancel_at_period_end: false,
          metadata: {
            cancellation_scheduled: "false",
          },
        });
      } else {
        const subscriptionSchedule = await stripe.subscriptionSchedules.create({
          from_subscription: subId,
        });

        const updateSchedule = await stripe.subscriptionSchedules.update(
          subscriptionSchedule.id,

          {
            end_behavior: "release", // Keep the subscription active after the schedule ends

            phases: [
              {
                items: [
                  {
                    price: currentPlanId, // existing plan id
                    quantity: 1,
                  },
                ],
                end_date: existingSubscription.current_period_end, // End of the current billing cycle
                start_date: existingSubscription.current_period_start, // Start of the current billing cycle
              },
              {
                items: [
                  {
                    price: mainPlanId, // Downgrade plan ID
                    quantity: 1,
                  },
                ],
                start_date: existingSubscription.current_period_end,
                proration_behavior: "none", // No proration for downgrades
              },
            ],
          }
        );

        await collection.updateMany(
          { _id: new ObjectId(u_id) },
          {
            $set: {
              isNextPlan: true,
            },
          }
        );

        // Handle the response for deferred downgrades
        return {
          code: "downgrade_scheduled",
          subscriptionId: updateSchedule.id,
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
          default_payment_method: defaultPaymentId,
        });

        // Finalize and pay the invoice immediately
        await stripe.invoices.pay(invoice.id);

        await collection.updateMany(
          { _id: new ObjectId(u_id) },
          {
            $set: {
              isNextPlan: true,
            },
          }
        );

        // Return success with proration details
        return {
          code: "upgrade_completed",
          subscriptionId: updatedSubscription.id,
          invoiceId: invoice.id,
          prorationAmount: invoice.total / 100,
          msg: "Subscription upgraded and prorated amount charged.",
          paymentIntentStatus: paymentIntent.status,
          createDate: updatedSubscription?.start_date,
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

    // If no existing subscription, create a new one
    return await createSubscriptionHandler(
      customerId,
      paymentMethodId,
      priceId
    );
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
