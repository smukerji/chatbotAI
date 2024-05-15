import React from 'react';
import PricingWrapper from './_components/pricingWrapper';
import { generateMetadata } from '@/app/_helpers/pageSeo';

export const metadata = generateMetadata({
  title: 'Pricing',
  canonical: '/home/pricing',
});

export default function Home() {
  return <PricingWrapper />;
}
