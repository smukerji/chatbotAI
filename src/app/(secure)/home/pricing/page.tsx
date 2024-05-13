import React from 'react';
import PricingWrapper from './_components/pricingWrapper';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Pricing',
  alternates: {
    canonical: '/home/pricing',
    languages: {
      en: '/en-us/home/pricing',
      zh: '/zh/home/pricing',
    },
  },
};

export default function Home() {
  return <PricingWrapper />;
}
