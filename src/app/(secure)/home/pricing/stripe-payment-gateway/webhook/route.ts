import { NextResponse } from "next/server";
import clientPromise from "@/db";
import Stripe from "stripe";
import { ObjectId } from "mongodb";
const stripe = new Stripe(String(process.env.NEXT_PUBLIC_STRIPE_SECRET_KEY));

export async function POST(req: any, res: any) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return `Method ${req.method} Not Allowed`;
  }

  const db = (await clientPromise!).db();
  const collection = db.collection("users");
  const collectionDetails = db.collection("user-details");
  const collectionPlan = db.collection("plans");
  const collectionPayment = db.collection("payment-history");

  const sig = req.headers.get("stripe-signature");
  const endpointSecret: any = process.env.NEXT_PUBLIC_STRIPE_WEBHOOK_PUBLIC;

  let event: any;
  const body = await req.text();

  try {
    event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
  } catch (err) {
    console.error("Webhook signature verification failed.", err);
    return res.status(400).end();
  }

  const planIds =
    event?.data?.object?.items?.data.map((item: any) => item?.plan?.id) || [];

  let date;
  let userData;
  let Details;

  try {
    switch (event.type) {
      case "customer.subscription.created":
        date = new Date(event.data.object.current_period_end * 1000);
        userData = await collection.findOne({
          customerId: event.data.object.customer,
        });

        if (!userData) {
          console.error(
            `User not found for customerId: ${event.data.object.customer}`
          );
          break;
        }

        Details = await collectionDetails.findOne({
          userId: String(userData._id),
        });

        if (!Details) {
          console.error(`Details not found for userId: ${userData._id}`);
          break;
        }

        for (const planId of planIds) {
          // if (!planData) {
          //   console.error(`Plan data not found for priceId: ${planId}`);
          //   continue;
          // }

          if (planId === process.env.NEXT_PUBLIC_WHATSAPP_PLAN_ID_MONTHLY) {
            await collection.updateOne(
              { customerId: event.data.object.customer },
              {
                $set: {
                  isWhatsapp: true,
                  subIdWhatsapp: event.data.object.id,
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
                  subIdSlack: event.data.object.id,
                },
              }
            );
          } else if (
            planId === process.env.NEXT_PUBLIC_TELEGRAM_PLAN_ID_MONTHLY
          ) {
            await collectionDetails.updateMany(
              { userId: String(userData._id) },
              {
                $set: {
                  isTelegram: true,
                  subIdTelegram: event.data.object.id,
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
                    Number(Details?.messageLimit) +
                    (planData.messageLimit ?? 0),
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
          } else {
            const planData = await collectionPlan.findOne({ priceId: planId });

            if (!planData) {
              console.error(`Plan data not found for priceId: ${planId}`);
              continue;
            }

            await collection.updateOne(
              { customerId: event.data.object.customer },
              {
                $set: {
                  subId: event.data.object.id ?? null,
                  endDate: date,
                  plan: planData.name ?? "",
                  planId: planData._id ?? null,
                  status: "active",
                  duration: event.data.object.items.data[0].plan.interval,
                  stripePlanId: planData.priceId ?? null,
                  isWhatsapp: planData.isWhatsapp ?? false,
                  subIdWhatsapp: event.data.object.id ?? null,
                  nextIsWhatsapp: planData.isWhatsapp ?? false,
                  lastUpdatedAt: new Date(),
                  planIds: planIds,
                },
              }
            );

            await collectionDetails.updateMany(
              { userId: String(userData?._id) },
              {
                $set: {
                  trainingDataLimit: planData.trainingDataLimit ?? 1000000,
                  totalMessageCount: 0,
                  messageLimit: planData.messageLimit ?? 2000,
                  chatbotLimit: planData.numberOfChatbot ?? 1,
                  websiteCrawlingLimit: planData.websiteCrawlingLimit ?? 10,
                  conversationHistory: planData.conversationHistory ?? "2",
                  leads: planData.leads ?? "10",
                  models: planData.models ?? "3.5&4o",
                  // isWhatsapp: planData.isWhatsapp ?? false,
                  isTelegram: planData.isTelegram ?? false,
                  subIdTelegram: event.data.object.id ?? null,
                  lastUpdatedAt: new Date(),
                },
              }
            );
          }
        }
        break;

      case "invoice.paid":
        date = new Date(event.data.object.lines.data[0].period.end * 1000);
        userData = await collection.findOne({
          customerId: event.data.object.customer,
        });

        if (!userData) {
          console.error(
            `User not found for customerId: ${event.data.object.customer}`
          );
          break;
        }

        const paymentStatus =
          event.data.object.status === "paid" ? "success" : "failed";
        const currentDate = new Date();
        const formattedDate = currentDate.toLocaleString("en-US", {
          month: "short",
          day: "2-digit",
          year: "numeric",
        });

        await collectionPayment.insertOne({
          userId: String(userData._id),
          status: paymentStatus,
          date: formattedDate,
          price: `$${event.data.object.amount_paid / 100}`,
          paymentId: event.data.object.id ?? null,
        });

        // Optionally update subscription end date if it's a renewal
        await collection.updateOne(
          { customerId: event.data.object.customer },
          { $set: { endDate: date } }
        );
        break;

      case "customer.subscription.deleted":
        userData = await collection.findOne({
          customerId: event.data.object.customer,
        });

        if (!userData) {
          console.error(
            `User not found for customerId: ${event.data.object.customer}`
          );
          break;
        }

        await collection.updateOne(
          { customerId: event.data.object.customer },
          {
            $set: {
              status: "canceled",
              endDate: new Date(event.data.object.current_period_end * 1000),
            },
          }
        );

        await collectionDetails.updateMany(
          { userId: String(userData._id) },
          {
            $set: {
              isWhatsapp: false,
              isSlack: false,
              isTelegram: false,
              messageLimit: 0,
              trainingDataLimit: 0,
              websiteCrawlingLimit: "0",
              conversationHistory: "0",
              leads: "0",
            },
          }
        );

        await collection.updateMany(
          { userId: String(userData._id) },
          {
            $set: {
              status: "cancel",
              nextIsWhatsapp: false,
              isWhatsapp: false,
            },
          }
        );
        break;

      case "customer.subscription.updated":
        userData = await collection.findOne({
          customerId: event.data.object.customer,
        });

        if (!userData) {
          console.error(
            `User not found for customerId: ${event.data.object.customer}`
          );
          break;
        }

        Details = await collectionDetails.findOne({
          userId: String(userData._id),
        });

        if (!Details) {
          console.error(`Details not found for userId: ${userData._id}`);
          break;
        }

        break;

      default:
        console.warn("Unhandled event type:", event.type);
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("Error processing webhook:", err);
    return res.status(500).end();
  }
}
