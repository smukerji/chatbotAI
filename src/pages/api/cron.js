export default async function handler(req, res) {
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).end("Unauthorized");
  }
  try {
    let client = new MongoClient(uri);
    let db = (await client.connect()).db();
    const collectionPlan = db.collection("plans");
    const collection = db.collection("users");
    const collectionPayment = db.collection("payment-history");
    const collectionUserDetails = db.collection("user-details");
    const currentDate = new Date();
    const cursor = await collection.find({
      endDate: { $lt: currentDate },
    });

    const dataa = await cursor.toArray();
    /// close the cursor
    await cursor.close();

    let price = 0;
    for (let i = 0; i < dataa.length; i++) {
      const data = dataa[i];
      const planDetails = await collectionPlan.findOne({ _id: data.planId });
      if (data.nextPlan != "") {
        const h = data.paymentId;
        console.log(String(data._id));
        // if (data.nextPlan == "individual") {
        if (data.nextPlanDuration == "month") {
          if (data.nextIsWhatsapp) {
            price = 22;
          } else {
            price = 15;
          }
        } else {
          price = 144;
        }
        // } else {
        //   if (data.nextPlanDuration == "month") {
        //     price = 89;
        //   } else {
        //     price = 854;
        //   }
        // }
        if (h) {
          amount = price * 100;
          //ANCHOR - stripe payment intent creation
          const paymentIntent = await stripe.paymentIntents.create({
            amount: amount,
            currency: "usd",
            automatic_payment_methods: {
              enabled: true,
            },
            confirm: true,
            customer: data.customerId,
            payment_method: data.paymentId,
            receipt_email: data.email,
            off_session: true,
          });

          const currentDate = new Date();
          if (data.nextPlanDuration == "month") {
            const endDate = new Date(
              currentDate.getTime() + 30 * 24 * 60 * 60 * 1000
            );
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
                  nextIsWhatsapp: data.nextIsWhatsapp,
                },
              }
            );
            console.log(paymentIntent);
            var formattedDate = currentDate.toLocaleString("en-US", {
              month: "short",
              day: "2-digit",
              year: "numeric",
            });
            const updatePayment = await collectionPayment.insertOne({
              userId: String(data._id),
              status: paymentIntent.status,
              date: formattedDate,
              price: "$" + price,
              paymentId: paymentIntent.id,
            });

            const updateUserDetails = await collectionUserDetails.updateOne(
              { userId: String(data._id) },
              {
                $set: {
                  totalMessageCount: 0,
                  messageLimit: planDetails.messageLimit,
                  chatbotLimit: planDetails.numberOfChatbot,
                  trainingDataLimit: planDetails.trainingDataLimit,
                  websiteCrawlingLimit: planDetails.websiteCrawlingLimit,
                },
              }
            );
          } else {
            const endDate = new Date(
              currentDate.getTime() + 365 * 24 * 60 * 60 * 1000
            );
            console.log(data._id);
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
                  nextIsWhatsapp: nextIsWhatsapp,
                },
              }
            );
            console.log(paymentIntent);
            var formattedDate = currentDate.toLocaleString("en-US", {
              month: "short",
              day: "2-digit",
              year: "numeric",
            });
            const updatePayment = await collectionPayment.insertOne({
              userId: String(data._id),
              status: paymentIntent.status,
              date: formattedDate,
              price: "$" + price,
              paymentId: paymentIntent.id,
            });
          }
        } else {
        }
      }
    }
  } catch (error) {
    console.error(error);
  }
  res.status(200).end("Sucess");
}
