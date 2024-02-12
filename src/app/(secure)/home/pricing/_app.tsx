// pages/_app.js
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import '../styles/globals.css'; // Import your global styles here
import { AppProps } from 'next/app';

const stripePromise = loadStripe("sk_test_51Mq8OZSIiEFKEPzTIq1BZu2jqgWMzIBKfJpLdTVnRDXoPL6wH4gp6Ju3okYqB5QLSA6Hkwn8wlxP5Xt9y6FbSKaE00JAsXarXn");

function MyApp({ Component, pageProps }: AppProps) {
    return (
      <Elements stripe={stripePromise}>
        <Component />
      </Elements>
    );
  }
  
  export default MyApp;