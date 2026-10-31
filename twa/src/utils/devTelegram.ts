/**
 * Local-only stand-in for Telegram: init data signed the way Telegram signs it
 * (core.telegram.org/bots/webapps), with the fake bot token of the test emulator
 * (functions/.env.test-project). Works only under `next dev` with
 * NEXT_PUBLIC_DEV_TELEGRAM_BOT_TOKEN set and `?tgUser=<id>` in the URL; production builds drop
 * this code. Without the parameter the app asks for a real Telegram login (TWA-02).
 */

const hmac = async (key: BufferSource, data: string): Promise<ArrayBuffer> => {
  const cryptoKey = await crypto.subtle.importKey("raw", key, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return crypto.subtle.sign("HMAC", cryptoKey, new TextEncoder().encode(data));
};

const toHex = (buffer: ArrayBuffer) =>
  Array.from(new Uint8Array(buffer)).map((b) => b.toString(16).padStart(2, "0")).join("");

/**
 * Signed init data for the fake user `tgUser` of the URL, or undefined outside `next dev` or
 * without the parameter.
 */
export const createDevInitData = async (): Promise<string | undefined> => {
  if (process.env.NODE_ENV !== "development") return undefined;

  const botToken = process.env.NEXT_PUBLIC_DEV_TELEGRAM_BOT_TOKEN;
  if (!botToken) return undefined;

  const userId = new URLSearchParams(window.location.search).get("tgUser");
  if (!userId) return undefined;

  const fields: Record<string, string> = {
    auth_date: `${Math.floor(Date.now() / 1000)}`,
    signature: "dev",
    user: JSON.stringify({ id: Number(userId), first_name: "Local", last_name: `Tester${userId}`, language_code: "ru" }),
  };

  const dataCheckString = Object.keys(fields).sort().map((key) => `${key}=${fields[key]}`).join("\n");
  const secret = await hmac(new TextEncoder().encode("WebAppData"), botToken);
  const hash = toHex(await hmac(secret, dataCheckString));

  return new URLSearchParams({ ...fields, hash }).toString();
};
