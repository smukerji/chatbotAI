
// }
import { NextApiRequest, NextApiResponse } from 'next';
import { NextResponse } from 'next/server';
import Stripe from "stripe";
const stripe = new Stripe(
  "sk_test_51Mq8OZSIiEFKEPzTIq1BZu2jqgWMzIBKfJpLdTVnRDXoPL6wH4gp6Ju3okYqB5QLSA6Hkwn8wlxP5Xt9y6FbSKaE00JAsXarXn"
  );
  
  export async function POST(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === 'POST') {
      try {
        
          // const customer = await stripe.customers.create({
          //   email: 'mit17@gmail.com', 
          //   // source: 'cus_PWuznbMX66EHNA',
          // });
      

      // const subscription = await stripe.subscriptions.create({
      //   customer: 'cus_PY2hh0pWHnA4pP',
      //   items: [{ price: 'price_1Ohs0XSIiEFKEPzTZVdCzh00' }], // Price ID of your subscription plan
      //   payment_behavior: 'default_incomplete', // Allow Stripe to manage payment retries
      //   collection_method: 'charge_automatically', // Automatically charge the customer
      // });
      const paymentIntent = await stripe.paymentIntents.create({
        amount: 2000,
        currency: 'inr',
        automatic_payment_methods: {
          enabled: true,
        },
        customer: 'cus_PY2hh0pWHnA4pP',
        payment_method: 'pm_1OiwdDSIiEFKEPzT9HoU00bK'
      });
      
      // res.status(200).json(subscription);
      return NextResponse.json(paymentIntent)
    } catch (error) {
      console.error(error);
      // res.status(500).json({ error: 'Unable to create subscription' });

    }
  } else {
    // res.setHeader('Allow', ['POST']);
    // res.status(405).end('Method Not Allowed');
    console.log("error")
  }
}

