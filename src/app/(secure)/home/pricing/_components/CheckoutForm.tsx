"use client";
import React, { useState } from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import axios from 'axios';
import Stripe from 'stripe';
import { StripeElements } from '@stripe/stripe-js';
const stripee = new Stripe(
  "sk_test_51Mq8OZSIiEFKEPzTIq1BZu2jqgWMzIBKfJpLdTVnRDXoPL6wH4gp6Ju3okYqB5QLSA6Hkwn8wlxP5Xt9y6FbSKaE00JAsXarXn"
  );

export default function CheckoutForm() {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState(null);

  const handleSubmit = async (event: any) => {
    event.preventDefault();
    
    if (!stripe || !elements) {
      return;
    }

    const cardElement: any = elements.getElement(CardElement);
    console.log("cardElement",cardElement)
    try {
      // const  paymentMethod  = await stripe.createPaymentMethod({type: 'card',card: cardElement});
      // console.log(paymentMethod)
      // const attachedPaymentMethod = await stripee.paymentMethods.attach('"pm_1OiwdDSIiEFKEPzT9HoU00bK"', {
      //   customer: 'cus_PY2hh0pWHnA4pP',
      // });
      
      // // Update the default payment method for the customer
      // await stripee.customers.update('cus_PY2hh0pWHnA4pP', {
      //   invoice_settings: {
      //     default_payment_method: '"pm_1OiwdDSIiEFKEPzT9HoU00bK"',
      //   },
      // });
      // const elements: StripeElements = {clientSecret:'sub_1OiweRSIiEFKEPzTGekqACgv'}
      const r =  stripe.confirmPayment({clientSecret: 'pi_3OixjCSIiEFKEPzT0XycBPHL_secret_B1yGCOt0SO79pCokQZYfWxKPL',confirmParams:{
        return_url: 'http://localhost:3000/home/pricing/stripe-payment-gateway/success'
      }})
      
      // const response = await axios.post('/api/createPaymentMethod', {
      //   paymentMethod: paymentMethod,
      // });
      console.log('Payment method created:', r);
    } catch (error) {
      console.error('Error creating payment method:', error);
      //   setError(error.message || 'An error occurred');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <CardElement />
      {error && <div>{error}</div>}
      <button type="submit" disabled={!stripe}>
        Pay
      </button>
    </form>
  );
};

// export default CheckoutForm;
