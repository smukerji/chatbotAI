import { NextResponse } from "next/server";
import clientPromise from "@/db";
import Stripe from "stripe";
import { ObjectId } from "mongodb";
const stripe = new Stripe(String(process.env.NEXT_PUBLIC_STRIPE_SECRET_KEY));

const businessPlanMonthly = process.env.NEXT_PUBLIC_BUSINESS_PLAN_MONTHLY;
const businessPlanYearly = process.env.NEXT_PUBLIC_BUSINESS_PLAN_YEARLY;
const individualPlanMonthly = process.env.NEXT_PUBLIC_INDIVIDUAL_PLAN_MONTHLY;
const individualPlanYearly = process.env.NEXT_PUBLIC_INDIVIDUAL_PLAN_YEARLY;
const starterPlanMonthly = process.env.NEXT_PUBLIC_STARTER_PLAN_MONTHLY;
const starterPlanYearly = process.env.NEXT_PUBLIC_STARTER_PLAN_YEARLY;

// one-off addons
const msgSmall: any = process.env.NEXT_PUBLIC_MESSAGESMALL_PLAN_ID;
const msgLarge: any = process.env.NEXT_PUBLIC_MESSAGELARGE_PLAN_ID;
const onBoarding: any = process.env.NEXT_PUBLIC_ONBOARDING_FEES;
const trainingData: any = process.env.NEXT_PUBLIC_TRAINING_DATA_MONTHLY;

const parentPlanIds = [
  businessPlanMonthly,
  businessPlanYearly,
  individualPlanMonthly,
  individualPlanYearly,
  starterPlanMonthly,
  starterPlanYearly,
];
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

  console.log("eventtttttt", event.type);

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
        // Separate one-off purchases and recurring add-ons
        const oneOffAddons = [msgSmall, msgLarge, onBoarding, trainingData];
        const isOneOff = planIds.every((id: any) => oneOffAddons.includes(id));
        const oneOffIds =
          event?.data?.object?.lines?.data.map(
            (item: any) => item?.price?.id
          ) || [];
        console.log(
          "planidsss",
          planIds,
          event?.data?.object?.lines?.data.map(
            (item: any) => item?.price?.id
          ) || []
        );

        userData = await collection.findOne({
          customerId: event.data.object.customer,
        });

        if (!userData) {
          console.error(
            `User not found for customerId: ${event.data.object.customer}`
          );
          break;
        }

        if (isOneOff) {
          for (let planId of oneOffIds) {
            if (planId == process.env.NEXT_PUBLIC_MESSAGESMALL_PLAN_ID) {
              const planData = await collectionPlan.findOne({
                priceId: planId,
              });
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
            } else if (planId == process.env.NEXT_PUBLIC_MESSAGELARGE_PLAN_ID) {
              const planData = await collectionPlan.findOne({
                priceId: planId,
              });
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
            } else if (planId == process.env.NEXT_PUBLIC_ONBOARDING_FEES) {
              const planData = await collectionPlan.findOne({
                priceId: planId,
              });
              const Details = await collectionDetails.findOne({
                userId: String(userData._id),
              });

              await collection.updateOne(
                { customerId: event.data.object.customer },
                {
                  $set: {
                    isOnboarding: planData.isOnboarding,
                  },
                }
              );
            } else if (
              planId == process.env.NEXT_PUBLIC_TRAINING_DATA_MONTHLY
            ) {
              const planData = await collectionPlan.findOne({
                priceId: planId,
              });

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
            }
          }
        }

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
              nextIsWhatsapp: false,
              isWhatsapp: false,
            },
          }
        );
        break;

      case "customer.subscription.updated":
        // only runs if parent planid is updated. Cause for addon it is already written in addon route

        // only update information if user has not schedule cancel plan
        if (event?.data?.object?.metadata?.cancellation_scheduled === "true") {
          break; // do nothing
        } else {
          if (planIds.some((planId: any) => parentPlanIds.includes(planId))) {
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

            let date = new Date(event.data.object.current_period_end * 1000);

            for (let planId of planIds) {
              if (
                planId == starterPlanMonthly ||
                planId == starterPlanYearly ||
                planId == individualPlanMonthly ||
                planId == individualPlanYearly ||
                planId == businessPlanMonthly ||
                planId == businessPlanYearly
              ) {
                const planData = await collectionPlan.findOne({
                  priceId: planId,
                });

                if (!planData) {
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
                      isNextPlan: true,
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
          }
        }

        break;

      //--------------------------------------- write code for voicebot payment-------------------------------
      case "payment_intent.succeeded":
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

        // this only applies to voicebot updation
        if (event.data.object.metadata.type === "credit") {
          await collection.updateOne(
            { customerId: event.data.object.customer },
            {
              $set: {
                voicebotPlanId: event.data.object.id,
                voicebotPlanStatus: event.data.object.status,
              },
            }
          );

          const previousCredits = Details?.voicebotDetails?.credits ?? 0;

          await collectionDetails.updateMany(
            { userId: String(userData?._id) },
            {
              $set: {
                voicebotDetails: {
                  credits: previousCredits + event?.data?.object?.amount / 100,
                },
              },
            }
          );
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
