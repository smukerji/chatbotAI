import { Button, Form, Input, Switch } from "antd";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import CryptoJS from "crypto-js";
import { useCookies } from "react-cookie";

const cryptoSecret = process.env.NEXT_PUBLIC_CRYPTO_SECRET;

function encryptPriceId(priceId: string) {
  if (!cryptoSecret) {
    throw new Error("Crypto secret is not defined");
  }
  return CryptoJS.AES.encrypt(priceId, cryptoSecret).toString();
}

function VoicebotUsage() {
  const router = useRouter();
  const [cookies, setCookie] = useCookies(["userId"]);

  const handleRedirect = (values: any) => {
    if (cookies?.userId) {
      const a = encryptPriceId(values.amountReload);
      const encryptedAmount = encodeURIComponent(a);
      router.push(`/home/pricing/voicebot/checkout?amount=${encryptedAmount}`);
    } else {
      router.push("/account/login");
    }
  };
  return (
    <>
      <div className="voicebot-usage-container">
        <div className="left-right">
          {/* Left Side */}
          <div className="usage-info">
            <div className="usage-card">
              <div className="usage-headline">
                <p className="usage-title">Daily Usage</p>
                <p className="usage-value">$5</p>
              </div>
              <p className="usage-subtitle">Today</p>
            </div>
            <div className="usage-card">
              <div className="usage-headline">
                <p className="usage-title">Monthly Usage</p>
                <p className="usage-value">$5</p>
              </div>
              <p className="usage-subtitle">Dec 01 - Dec 31</p>
            </div>
            <div className="usage-card">
              <div className="usage-headline">
                <p className="usage-title">Wallet Credits</p>
                <p className="usage-value">$100</p>
              </div>
            </div>
          </div>

          {/* Right Side */}
          <div className="auto-reload">
            {/* <div className="toggle-container">
              <label>
                <Switch defaultChecked /> Enable auto reload
              </label>
            </div> */}
            {/* <div className="reload-settings">
              <div className="input-group">
                <label>Amount to reload</label>
                <input
                  type="number"
                  placeholder="$ 20"
                  onChange={(e) => {
                    setAmountReload(e.target.value);
                  }}
                />
              </div>
              <div className="input-group">
                <label>When balance reaches</label>
                <input type="number" placeholder="$" />
              </div>
            </div>
            <button className="buy-credits" onClick={handleRedirect}>
              Buy Credits
            </button> */}
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
    </>
  );
}

export default VoicebotUsage;
