import crypto from "crypto";
import { config } from "./config.js";

export const createQrCodeValue = ({ qrId, sessionId, expiresAt }) => {
  const payload = `${qrId}|${sessionId}|${expiresAt}`;
  const signature = crypto
    .createHmac("sha256", config.qrSecret)
    .update(payload)
    .digest("hex");

  return Buffer.from(`${payload}|${signature}`).toString("base64url");
};

export const verifyQrCodeValue = (encodedValue) => {
  const decoded = Buffer.from(encodedValue, "base64url").toString("utf8");
  const [qrId, sessionId, expiresAt, signature] = decoded.split("|");
  const payload = `${qrId}|${sessionId}|${expiresAt}`;
  const expected = crypto
    .createHmac("sha256", config.qrSecret)
    .update(payload)
    .digest("hex");

  if (signature !== expected) {
    throw new Error("QR signature tidak valid.");
  }

  return { qrId, sessionId, expiresAt };
};

export const buildQrSvg = ({ title, code, subtitle }) => `
<svg xmlns="http://www.w3.org/2000/svg" width="420" height="420" viewBox="0 0 420 420" fill="none">
  <rect width="420" height="420" rx="32" fill="#F8FBFC"/>
  <rect x="28" y="28" width="364" height="364" rx="24" fill="#FFFFFF" stroke="#DCE5EA"/>
  <rect x="60" y="60" width="96" height="96" rx="12" fill="#145374"/>
  <rect x="264" y="60" width="96" height="96" rx="12" fill="#145374"/>
  <rect x="60" y="264" width="96" height="96" rx="12" fill="#145374"/>
  <rect x="84" y="84" width="48" height="48" rx="8" fill="#F8FBFC"/>
  <rect x="288" y="84" width="48" height="48" rx="8" fill="#F8FBFC"/>
  <rect x="84" y="288" width="48" height="48" rx="8" fill="#F8FBFC"/>
  <path d="M190 86h24v24h-24zM222 86h24v24h-24zM190 118h24v24h-24zM254 118h24v24h-24zM222 150h24v24h-24zM190 182h24v24h-24zM222 182h24v24h-24zM286 182h24v24h-24zM158 214h24v24h-24zM190 214h24v24h-24zM254 214h24v24h-24zM286 214h24v24h-24zM190 246h24v24h-24zM222 246h24v24h-24zM254 246h24v24h-24zM158 278h24v24h-24zM222 278h24v24h-24zM286 278h24v24h-24zM190 310h24v24h-24zM254 310h24v24h-24z" fill="#145374"/>
  <text x="210" y="382" text-anchor="middle" fill="#145374" font-size="16" font-family="Arial, sans-serif">${title}</text>
  <text x="210" y="402" text-anchor="middle" fill="#5F7280" font-size="10" font-family="Arial, sans-serif">${subtitle}</text>
  <metadata>${code}</metadata>
</svg>
`;
