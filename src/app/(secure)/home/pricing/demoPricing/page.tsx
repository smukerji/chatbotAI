"use client";
import axios from "axios";
import { useRouter } from "next/navigation";
import React from "react";
import { useCookies } from "react-cookie";

function page() {
  const router = useRouter();

  async function handleClick() {
    router.push(
      `/home/pricing/dummy-checkout?priceId=price_1Pq7Z7HhVvYsUDoGdMfV4ZPt`
    );
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
