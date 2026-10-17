import Stripe from "stripe";

let client: Stripe | null = null;

export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key || key.includes("REPLACE_ME")) throw new Error("STRIPE_SECRET_KEY is not configured");
  if (!client) client = new Stripe(key);
  return client;
}
