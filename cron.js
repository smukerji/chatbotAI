const cron = require('node-cron');
const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config({ path: '.env.local' });
// import { Stripe } from "stripe";
const Stripe = require('stripe');
const { object } = require('joi');

const uri = process.env.NEXT_PUBLIC_MONGO_URI;
const stripe = new Stripe(String(process.env.NEXT_PUBLIC_STRIPE_SECRET_KEY));

// Define your cron job
// cron.schedule('*/10 * * * * *', () => {
cron.schedule('01 00 * * *', () => {
  console.log('Cron job is running...');
  CronFunction();
});

async function CronFunction() {
  try {
    let client = new MongoClient(uri);
    let db = (await client.connect()).db();
    const collectionPlan = db.collection('plans');
    const collection = db.collection('users');
    const collectionPayment = db.collection('payment-history');
    const collectionUserDetails = db.collection('user-details');
    const currentDate = new Date();
    const cursor = await collection.find({
      endDate: { $lt: currentDate }
    });
    const updateLimitTime = await collectionUserDetails.find({
      limitEndDate: { $lt: currentDate }
    });
    const limitDataArray = await updateLimitTime.toArray();
    /// close the limitDate
    await updateLimitTime.close();
    for (let j = 0; j < limitDataArray.length; j++) {
      const limitData = limitDataArray[j];
      const endDate = new Date(limitData.limitEndDate.getTime() + 30 * 24 * 60 * 60 * 1000);
      const data = await collection.findOne({ _id: new ObjectId(limitData.userId) });
      const plan_data = await collectionPlan.findOne({ _id: data.planId });
      const updateUserDetails = await collectionUserDetails.updateMany(
        { userId: String(limitData.userId) },
        {
          $set: {
            totalMessageCount: 0,
            chatbotLimit: plan_data.numberOfChatbot,
            messageLimit: plan_data.messageLimit,
            trainingDataLimit: plan_data.trainingDataLimit,
            websiteCrawlingLimit: plan_data.websiteCrawlingLimit,
            limitEndDate: endDate
          }
        }
      );
        if(data.nextIsWhatsapp == true){
          const paymentIntent = await stripe.paymentIntents.create({
            amount: 700,
            currency: 'usd',
            automatic_payment_methods: {
              enabled: true
            },
            confirm: true,
            customer: data.customerId,
            payment_method: data.paymentId,
            receipt_email: data.email,
            off_session: true
          });

          var formattedDate = currentDate.toLocaleString('en-US', {
            month: 'short',
            day: '2-digit',
            year: 'numeric'
          });
          const updatePayment = await collectionPayment.insertOne({
            userId: String(data._id),
            status: paymentIntent.status,
            date: formattedDate,
            price: '$' + 7,
            paymentId: paymentIntent.id
          });

        }
        else{
          const update = await collection.updateMany({_id: new ObjectId(limitData.userId)},{
            $set:{
              isWhatsapp:false
            }
          })
        }
      // const updateWhatsapp = await collection.updateMany(
      //   { _id: new ObjectId(limitData.userId) },
      //   {
      //     $set: {
      //       isWhatsapp: false,
      //       nextIsWhatsapp: false
      //     }
      //   }
      // );
    }

    const dataa = await cursor.toArray();
    /// close the cursor
    await cursor.close();

    let price = 0;
    for (let i = 0; i < dataa.length; i++) {
      const data = dataa[i];
      const planDetails = await collectionPlan.findOne({ _id: data.planId });
      if (data.nextPlan != '') {
        const h = data.paymentId;
        if (data.nextPlan == 'individual') {
          if (data.nextPlanDuration == 'month') {
            if (data.nextIsWhatsapp) {
              price = 22;
            } else {
              price = 15;
            }
          } else {
            if (data.nextIsWhatsapp) {
              price = 151;
            } else {
              price = 144;
            }
          }
        } else {
          if (data.nextPlanDuration == 'month') {
            if (data.nextIsWhatsapp) {
              price = 96;
            } else {
              price = 89;
            }
          } else {
            if (data.nextIsWhatsapp) {
              price = 861;
            } else {
              price = 854;
            }
          }
        }
        if (h) {
          amount = price * 100;
          //ANCHOR - stripe payment intent creation
          const paymentIntent = await stripe.paymentIntents.create({
            amount: amount,
            currency: 'usd',
            automatic_payment_methods: {
              enabled: true
            },
            confirm: true,
            customer: data.customerId,
            payment_method: data.paymentId,
            receipt_email: data.email,
            off_session: true
          });

          const currentDate = new Date();
          if (data.nextPlanDuration == 'month') {
            const endDate = new Date(currentDate.getTime() + 30 * 24 * 60 * 60 * 1000);
            const updateData = await collection.updateMany(
              { _id: data._id },
              {
                $set: {
                  plan: data.nextPlan,
                  startDate: currentDate,
                  endDate: endDate,
                  duration: data.nextPlanDuration,
                  planId: data.nextPlanId,
                  nextPlan: data.nextPlan,
                  nextPlanId: data.nextPlanId,
                  nextPlanDuration: data.nextPlanDuration,
                  isWhatsapp: data.nextIsWhatsapp,
                  nextIsWhatsapp: data.nextIsWhatsapp
                }
              }
            );
            var formattedDate = currentDate.toLocaleString('en-US', {
              month: 'short',
              day: '2-digit',
              year: 'numeric'
            });
            const updatePayment = await collectionPayment.insertOne({
              userId: String(data._id),
              status: paymentIntent.status,
              date: formattedDate,
              price: '$' + price,
              paymentId: paymentIntent.id
            });

            const updateUserDetails = await collectionUserDetails.updateOne(
              { userId: String(data._id) },
              {
                $set: {
                  totalMessageCount: 0,
                  messageLimit: planDetails.messageLimit,
                  chatbotLimit: planDetails.numberOfChatbot,
                  trainingDataLimit: planDetails.trainingDataLimit,
                  websiteCrawlingLimit: planDetails.websiteCrawlingLimit
                }
              }
            );
          } else {
            const endDate = new Date(currentDate.getTime() + 365 * 24 * 60 * 60 * 1000);
            const updateData = await collection.updateMany(
              { _id: new ObjectId(data._id) },
              {
                $set: {
                  plan: data.nextPlan,
                  startDate: currentDate,
                  endDate: endDate,
                  duration: data.nextPlanDuration,
                  planId: data.nextPlanId,
                  nextPlan: data.nextPlan,
                  nextPlanId: data.nextPlanId,
                  nextPlanDuration: data.nextPlanDuration,
                  isWhatsapp: data.nextIsWhatsapp,
                  nextIsWhatsapp: nextIsWhatsapp
                }
              }
            );
            var formattedDate = currentDate.toLocaleString('en-US', {
              month: 'short',
              day: '2-digit',
              year: 'numeric'
            });
            const updatePayment = await collectionPayment.insertOne({
              userId: String(data._id),
              status: paymentIntent.status,
              date: formattedDate,
              price: '$' + price,
              paymentId: paymentIntent.id
            });
          }
        } else {
        }
      }
    }
  } catch (error) {
    console.error(error);
  }
}
