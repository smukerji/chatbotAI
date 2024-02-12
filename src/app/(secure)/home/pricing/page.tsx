"use client";
// import React, { useState } from 'react';
// import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
// import axios from 'axios';

// const CheckoutForm = () => {
//     const elements = useElements();
//   const stripe: any = useStripe();
//   const [error, setError] = useState(null);

//   const handleSubmit = async (event: any) => {
//     event.preventDefault();
  
//     if (!stripe || !elements) {
//       return;
//     }
  
//     const cardElement: any =  elements.getElement(CardElement);
  
//     try {
//       const { paymentMethod } = await stripe.createPaymentMethod({type:'card', card: cardElement});
  
//       const response = await axios.post('/api/createPaymentMethod', {
//         paymentMethod: paymentMethod,
//       });
//       console.log('Payment method created:', response.data);
//     } catch (error) {
//       console.error('Error creating payment method:', error);
//     }
//   };

//   return (
//     <form onSubmit={handleSubmit}>
//       <CardElement />
//       {error && <div>{error}</div>}
//       <button type="submit" disabled={!stripe}>
//         Pay
//       </button>
//     </form>
//   );
// };

// export default CheckoutForm;
// pages/index.js
import CheckoutForm from './_components/CheckoutForm';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';

const stripePromise = loadStripe("pk_test_51Mq8OZSIiEFKEPzTx5NCTD758P2eMjqEcYtXefdt34Pj2WL65GTlG2062leXxoouraTjf69SowcWjgiXvqhYXWOk00BxfySViI");


export default function Home() {
  return (
    <Elements stripe={stripePromise}>
        <CheckoutForm />
    </Elements>
  );
}
