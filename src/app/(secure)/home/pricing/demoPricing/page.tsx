"use client";
import axios from "axios";
import { useRouter } from "next/navigation";
import React from "react";
import { useCookies } from "react-cookie";
import CryptoJS from "crypto-js";

function page() {
  const router = useRouter();
  const cryptoSecret = process.env.NEXT_PUBLIC_CRYPTO_SECRET;

  function encryptPriceId(priceId: string) {
    if (!cryptoSecret) {
      throw new Error("Crypto secret is not defined");
    }
    return CryptoJS.AES.encrypt(priceId, cryptoSecret).toString();
  }

  async function handleClick() {
    const a = encryptPriceId("price_1Pq7Z7HhVvYsUDoGdMfV4ZPt");
    const encryptedPriceId = encodeURIComponent(a);

    router.push(`/home/pricing/dummy-checkout?priceId=${encryptedPriceId}`);
  }

  return (
    <>
      <button onClick={handleClick}>Starter plan $1</button>
      <button>Individual plan $10</button>
      <button>Business plan $100</button>
    </>
  );
}

export default page;
