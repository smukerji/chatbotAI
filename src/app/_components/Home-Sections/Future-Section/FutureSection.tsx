"use client";
import React from "react";
import "./future-section.scss";
import { useRouter } from "next/navigation";

const ALINA_ASSISTANT_ID = process.env.NEXT_PUBLIC_ALINA_ASSISTANT_ID;

function FutureSection() {
  const router = useRouter();
  return (
    <>
      <section className="future-section">
        <div className="future-content">
          <h1>
            The Future Workforce Is Here.
            <br />
            Are You Ready?
          </h1>
          <button
            className="start-button"
            onClick={() => router.push("/account/register")}
          >
            Register
          </button>
          <div className="future-links">
            <a
              style={{ cursor: "pointer" }}
              onClick={() => router.push("/home/call?agent=jessica")}
            >
              Talk to Our AI
            </a>
            <a
              style={{ cursor: "pointer" }}
              onClick={() =>
                router.push(
                  `/home/chat?agent=alina&assistantId=${ALINA_ASSISTANT_ID}`
                )
              }
            >
              Try eCommerce Agent
            </a>
          </div>
        </div>
      </section>
    </>
  );
}

export default FutureSection;
