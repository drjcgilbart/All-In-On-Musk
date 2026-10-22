import Stripe from "stripe";

let client: Stripe | null = null;

export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key || key.includes("REPLACE_ME")) throw new Error("STRIPE_SECRET_KEY is not configured");
  if (!client) {
    // Local tests only: point the SDK at a mock Stripe server (ignored in production builds).
    const mock = process.env.NODE_ENV !== "production" ? process.env.STRIPE_MOCK_URL : undefined;
    if (mock) {
      const u = new URL(mock);
      client = new Stripe(key, { host: u.hostname, port: Number(u.port || 80), protocol: u.protocol.replace(":", "") as "http" | "https" });
    } else client = new Stripe(key);
  }
  return client;
}
