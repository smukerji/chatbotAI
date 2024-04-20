'use client';
import React, { useEffect, useState } from 'react';
import { useStripe, useElements, CardNumberElement, CardCvcElement, CardExpiryElement } from '@stripe/react-stripe-js';
import axios from 'axios';
import Stripe from 'stripe';
import { useRouter } from 'next/navigation';
import Loader from '../_components/Loader';
import { StripeElements } from '@stripe/stripe-js';
const stripee = new Stripe(String(process.env.NEXT_PUBLIC_STRIPE_SECRET_KEY));
import '../../pricing/stripe.scss';
import { useCookies } from 'react-cookie';
import { message } from 'antd';

export default function CreatePaymentMethod({ plan, price, duration, name }: any) {
  const stripe = useStripe();
  const elements: any = useElements();
  const [error, setError] = useState(null);
  const router = useRouter();
  const [cookies, setCookie] = useCookies(['userId']);
  const [loading, setLoading] = useState(false);
  const u_id: any = cookies.userId;
  const [isChecked, setIsChecked] = useState(true);
  const [isCheckedSlack, setIsCheckedSlack] = useState(true);
  const [newPrice, setNewPrice] = useState<any>(price);
  const [defaultChecked, setDefault] = useState(false);
  const WhatsappModal = async () => {
    const whatsappData = await axios.put(
      `${process.env.NEXT_PUBLIC_WEBSITE_URL}home/pricing/stripe-payment-gateway/getCustomer`,
      {
        u_id: u_id
      }
    );
    setDefault(whatsappData.data.msg);
    setIsChecked(whatsappData.data.msg);
    setIsCheckedSlack(whatsappData.data.msg);
    console.log(defaultChecked);
  };

  useEffect(() => {
    if (isChecked && isCheckedSlack && (plan == 1 || plan == 3 || plan == 2 || plan == 4) && defaultChecked) {
      console.log('WHY HERE', defaultChecked);
      setNewPrice(Number(price) + Number(14));
    } else if (
      (isChecked && !isCheckedSlack) ||
      (!isChecked && isCheckedSlack && (plan == 1 || plan == 3 || plan == 2 || plan == 4) && defaultChecked)
    ) {
      setNewPrice(Number(price) + Number(7));
    } else {
      setNewPrice(price);
    }
  }, [isChecked, defaultChecked, isCheckedSlack, newPrice]);

  useEffect(() => {
    setNewPrice(price);
    WhatsappModal();
  }, []);
  const handleSubmit = async (event: any) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setLoading(true);

    const cardNumber: any = elements.getElement(CardNumberElement);
    const cardCvc: any = elements.getElement(CardCvcElement);
    const cardExpiry: any = elements.getElement(CardExpiryElement);
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_WEBSITE_URL}home/pricing/stripe-payment-gateway/getCustomer`,
        {
          u_id: u_id
        }
      );
    } catch {
      message.error('error while getting customer data');
      throw error;
    }
    try {
      const paymentMethod = await stripe.createPaymentMethod({
        type: 'card',
        card: cardNumber
      });
      const id: any = paymentMethod.paymentMethod?.id;
      if (paymentMethod.paymentMethod?.id) {
        const update = await axios.post(
          `${process.env.NEXT_PUBLIC_WEBSITE_URL}home/pricing/stripe-payment-gateway/updatePaymentMethod`,
          { paymentId: paymentMethod.paymentMethod?.id, u_id: u_id }
        );

        if (update.data.acknowledged) {
          //ANCHOR - api call to create paymentIntent
          const result = await axios.post(`${process.env.NEXT_PUBLIC_WEBSITE_URL}home/pricing/stripe-payment-gateway`, {
            plan: plan,
            price: newPrice,
            u_id: u_id,
            isWhatsapp: isChecked,
            isSlack: isCheckedSlack
          });

          try {
            if (result.data) {
              if (result.data.status == 'active') {
                message.success('success').then(() => {
                  window.location.href = `${process.env.NEXT_PUBLIC_WEBSITE_URL}chatbot`;
                  return;
                });
              } else {
                message.error(`failed`).then(() => {
                  window.location.href = `${process.env.NEXT_PUBLIC_WEBSITE_URL}home/pricing`;
                  return;
                });
              }
            } else {
              message.error(`Invalid card`).then(() => {
                window.location.href = `${process.env.NEXT_PUBLIC_WEBSITE_URL}home/pricing`;
                return;
              });
            }
          } catch (error: any) {
            message.error(error?.message).then(() => {
              window.location.href = `${process.env.NEXT_PUBLIC_WEBSITE_URL}home/pricing`;
              return;
            });
          }
          // setLoading(false)
        } else {
          message.error(update.data.code).then(() => {
            window.location.href = `${process.env.NEXT_PUBLIC_WEBSITE_URL}home/pricing`;
            return;
          });
        }
      } else {
        message.error('Finding error while making payment with this card, please check your card details').then(() => {
          window.location.href = `${process.env.NEXT_PUBLIC_WEBSITE_URL}home/pricing`;
          return;
        });
      }
    } catch (error) {
      message.error(`${error}`);
      window.location.href = `${process.env.NEXT_PUBLIC_WEBSITE_URL}home/pricing`;
      throw error;
    }
  };

  console.log(typeof price, newPrice, price);
  return (
    <>
      {loading && <Loader />}
      {
        <div className='card-main'>
          <div className='card-head'>Billing Info</div>
          <form className='cardElementForm' onSubmit={handleSubmit}>
            <div className='left'>
              <div className='top-left'>
                <div className='plan-name'>{name}</div>
                <div className='price'>
                  <span>${price}</span>
                  <span className='price-duration'>Per {duration}</span>
                </div>
              </div>
              {/* <Image src={line} alt={"no image"} /> */}
              {(plan == 1 || plan == 3 || plan == 2 || plan == 4) && defaultChecked && (
                <div className='checkbox'>
                  <input
                    type='checkbox'
                    defaultChecked={defaultChecked}
                    checked={isChecked}
                    className='price-checkbox'
                    id='whatsappIntegrationCheckbox'
                    onChange={(e) => {
                      setIsChecked(e.target.checked);
                    }}
                  />
                  <label htmlFor='whatsappIntegrationCheckbox' className='checkbox-label'>
                    Add whatsapp Integration
                  </label>
                </div>
              )}
              {(plan == 1 || plan == 3 || plan == 2 || plan == 4) && defaultChecked && (
                <div className='checkbox'>
                  <input
                    type='checkbox'
                    defaultChecked={defaultChecked}
                    checked={isCheckedSlack}
                    id='slackIntegrationCheckbox'
                    className='price-checkbox'
                    onChange={(e) => {
                      setIsCheckedSlack(e.target.checked);
                    }}
                  />
                  <label htmlFor='slackIntegrationCheckbox' className='checkbox-label'>
                    Add Slack Integration
                  </label>
                </div>
              )}
              <div className='bottom-left'>
                <div className='total'>Total</div>
                <div className='total-price'>${newPrice ? newPrice : price}</div>
              </div>
            </div>
            <div className='right'>
              <div className='right-top'>Pay with Card</div>
              <div className='card-element'>
                <label className='card-label'>Card Number</label>
                <div className='cardNumber'>
                  <CardNumberElement />
                </div>
                <label className='card-label'>Card Expiry</label>
                <div className='cardExpiry'>
                  <CardExpiryElement />
                </div>
                <label className='card-label'>Card CVC</label>
                <div className='cardCvc'>
                  <CardCvcElement />
                </div>
              </div>
              {error && <div>{error}</div>}
              <button className='btn-card-submit' type='submit' disabled={!stripe}>
                Pay
              </button>
            </div>
          </form>
        </div>
      }
    </>
  );
}

// //ANCHOR - payment confirmation
// const r = stripe.confirmPayment({
//   clientSecret: result.data.client_secret,
//   confirmParams: {
//     return_url: `${process.env.NEXT_PUBLIC_WEBSITE_URL}chatbot`,
//   },
// });

//ANCHOR - adding data to backend
// const a = await axios.post(
//   `${process.env.NEXT_PUBLIC_WEBSITE_URL}home/pricing/stripe-payment-gateway/add-payment`,
//   {
//     plan: plan,
//     duration: duration,
//     u_id: u_id,
//     status: "success",
//     paymentId: result.data.id,
//     price: newPrice,
//     isWhatsapp: isChecked,
//     nextIsWhatsapp: isChecked,
//     isSlack: isCheckedSlack
//   }
// );
