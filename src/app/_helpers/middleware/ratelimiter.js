import {
  defaultRateLimit,
  defaultRateLimitMessage,
  defaultRateLimitTime,
} from "../constant";

const rateLimitMap = new Map();

export default function rateLimitMiddleware(handler) {
  return async (req, res) => {
    const json = await req.json();
    req.json = () => json;
    const chatbotId = json?.chatbotId;
    const userId = json?.userId;

    /// get the chatbot settings from database
    const chatbotSettingsResponse = await fetch(
      `${process.env.NEXT_PUBLIC_WEBSITE_URL}chatbot/dashboard/api?chatbotId=${chatbotId}&userId=${userId}`,
      {
        method: "GET",
        next: { revalidate: 0 },
      }
    );
    const data = await chatbotSettingsResponse.json();
    const chatbotSetting = data?.chatbotSetting;

    const ip =
      req.headers.get("x-forwarded-for") || req.connection?.remoteAddress;

    const limit = chatbotSetting?.rateLimit
      ? chatbotSetting?.rateLimit
      : defaultRateLimit;
    const windowMs =
      (chatbotSetting?.rateLimitTime
        ? chatbotSetting?.rateLimitTime
        : defaultRateLimitTime) * 1000;

    if (!rateLimitMap.has(ip)) {
      rateLimitMap.set(ip, {
        count: 0,
        lastReset: Date.now(),
      });
    }

    const ipData = rateLimitMap.get(ip);

    if (Date.now() - ipData.lastReset > windowMs) {
      ipData.count = 0;
      ipData.lastReset = Date.now();
    }

    if (ipData.count >= limit) {
      return new Response(
        chatbotSetting?.rateLimitMessage
          ? chatbotSetting?.rateLimitMessage
          : defaultRateLimitMessage,
        { status: 429 }
      );
    }

    ipData.count += 1;

    return handler(req, res);
  };
}
