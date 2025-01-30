import { Button, Form, Input, Switch } from "antd";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import CryptoJS from "crypto-js";
import { useCookies } from "react-cookie";
import axios from "axios";
import Loader from "../../pricing/_components/Loader";
import moment from "moment";
import { Flex, Modal, message, Spin } from 'antd';
const cryptoSecret = process.env.NEXT_PUBLIC_CRYPTO_SECRET;

function encryptPriceId(priceId: string) {
  if (!cryptoSecret) {
    throw new Error("Crypto secret is not defined");
  }
  return CryptoJS.AES.encrypt(priceId, cryptoSecret).toString();
}

function VoicebotUsage({ firstPurchase = false }) {
  const router = useRouter();
  const [cookies, setCookie] = useCookies(["userId"]);
  const [walletCredits, setWalletCredits] = useState(0);
  const [dailyUsage, setDailyUsage] = useState(0);
  const [monthlyUsage, setMonthlyUsage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [usageLoad, setUsageLoad] = useState(false);

  const handleRedirect = (values: any) => {
    if (cookies?.userId) {
      const a = encryptPriceId(values.amountReload);
      const b = encryptPriceId(walletCredits.toString(  ));
      const encryptedAmount = encodeURIComponent(a);
      const encryptedCredit = encodeURIComponent(b);
      debugger;
      // if(firstPurchase == true){
      //   router.push(`/create-first-assistant?amount=${encryptedAmount}&credit=${encryptedCredit}&voicebotPurchase=true`);
      // }
      // else{
        router.push(
          `/home/pricing/voicebot/checkout?amount=${encryptedAmount}&credit=${encryptedCredit}&firstVoicePurchase=${firstPurchase}`
        );
      // }

    } else {
      router.push("/account/login");
    }
  };
  

  const fetchVoicebotUsageDetail = async () => {
    try {
      setLoading(true);
      setUsageLoad(true);
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_WEBSITE_URL}home/BillingAndUsage/api/voicebot/usage`,
        {
          u_id: cookies.userId,
        }
      );

      //get dailly and monthly usage

      const usageResult = await fetch(
        `${process.env.NEXT_PUBLIC_WEBSITE_URL}voicebot/dashboard/api/costs-wallates/usages?userId=${cookies.userId}&todayDate=${moment().format('YYYY-MM-DD')}&monthDate=${moment().format('YYYY-MM')}`,
        {
          method: "GET",
        }
      );

      const parseUsageResult = await usageResult.json();
      if("dayUsage" in parseUsageResult.data.usage){
        setDailyUsage(parseUsageResult.data.usage.dayUsage);
      }
      if("monthUsage" in parseUsageResult.data.usage){
        setMonthlyUsage(parseUsageResult.data.usage.monthUsage);
      }
     

      setWalletCredits(response.data.walletCredit.credits);
    } catch (error) {
      console.log("error", error);
    } finally {
      setLoading(false);
      setUsageLoad(false);
    }
  };

  useEffect(() => {
    fetchVoicebotUsageDetail();
  }, []);
  return (
    <>
      {/* {loading ? (
        <Loader />
      ) : ( */}
        <div className="voicebot-usage-container">
          <div className="left-right">
            {/* Left Side */}
          <div className="usage-info">
            {
              usageLoad ? (
                <div className="usage-loader">
                  <Flex align="center" gap="middle" className="loader">
                    <Spin size="large" />
                  </Flex>
                </div>
                
              ) : <>
                <div className="usage-card">
                  <div className="usage-headline">
                    <p className="usage-title">Daily Usage</p>
                    <p className="usage-value">${dailyUsage.toFixed(2)}</p>
                  </div>
                  <p className="usage-subtitle">Today</p>
                </div>
                <div className="usage-card">
                  <div className="usage-headline">
                    <p className="usage-title">Monthly Usage</p>
                    <p className="usage-value">${monthlyUsage.toFixed(2)}</p>
                  </div>
                  <p className="usage-subtitle">Dec 01 - Dec 31</p>
                </div>
                <div className="usage-card">
                  <div className="usage-headline">
                    <p className="usage-title">Wallet Credits</p>
                    <p className="usage-value">${walletCredits.toFixed(2)}</p>
                  </div>
                </div>
              </>
            }

          </div>

            {/* Right Side */}
            <div className="auto-reload">
              <Form
                className="reload-settings"
                onFinish={handleRedirect}
                initialValues={{ amountReload: "" }}
                layout="vertical"
              >
                <Form.Item
                  label="Amount to reload"
                  name="amountReload"
                  rules={[
                    {
                      required: true,
                      message: "Please enter an amount to reload",
                    },
                    //   {
                    //     type: "number",
                    //     min: 5,
                    //     message: "Amount must be atleast $5",
                    //   },
                  ]}
                >
                  <Input type="number" placeholder="$ 20" />
                </Form.Item>

                <Form.Item label="When balance reaches">
                  <Input type="number" placeholder="$" />
                </Form.Item>

                <Form.Item>
                  <Button
                    type="primary"
                    htmlType="submit"
                    className="buy-credits"
                  >
                    Buy Credits
                  </Button>
                </Form.Item>
              </Form>
            </div>
          </div>
        </div>
      {/* )} */}
    </>
  );
}

export default VoicebotUsage;
