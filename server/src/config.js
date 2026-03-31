import path from "path";
import dotenv from "dotenv";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../../.env") });
dotenv.config();

/**
 * Fail-Fast: Validasi environment variables yang WAJIB ada di production.
 * Aplikasi akan langsung berhenti jika variabel kritis tidak diatur,
 * mencegah server berjalan dalam keadaan rentan.
 */
const requiredEnvVars = [
  "JWT_SECRET",
  "QR_SECRET"
];

const missingVars = requiredEnvVars.filter((varName) => !process.env[varName]);

if (missingVars.length > 0) {
  console.error("╔══════════════════════════════════════════════════════════╗");
  console.error("║  FATAL: Environment variables yang wajib tidak diatur!  ║");
  console.error("╠══════════════════════════════════════════════════════════╣");
  console.error(`║  Variabel yang hilang: ${missingVars.join(", ").padEnd(40)}║`);
  console.error("║                                                          ║");
  console.error("║  Server TIDAK akan berjalan untuk mencegah kerentanan.  ║");
  console.error("║  Silakan atur variabel ini di file .env Anda.           ║");
  console.error("╚══════════════════════════════════════════════════════════╝");
  process.exit(1);
}

const parseBoolean = (value, fallback = false) => {
  if (value === undefined) {
    return fallback;
  }

  return String(value).toLowerCase() === "true";
};

const parseAllowedOrigins = () => {
  const rawOrigins = [
    process.env.CLIENT_URL,
    process.env.APP_URL,
    ...(process.env.ALLOWED_ORIGINS || "")
      .split(",")
      .map((origin) => origin.trim())
      .filter(Boolean)
  ];

  return [...new Set(rawOrigins.filter(Boolean))];
};

export const config = {
  port: Number(process.env.PORT || 4000),
  clientUrl: process.env.CLIENT_URL || "http://localhost:5173",
  allowedOrigins: parseAllowedOrigins(),
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "8h",
  cookieName: process.env.COOKIE_NAME || "bimbel_access_token",
  cookieSecure: parseBoolean(process.env.COOKIE_SECURE, false),
  cookieSameSite: process.env.COOKIE_SAME_SITE || "lax",
  appUrl: process.env.APP_URL || "http://localhost:5173",
  allowBootstrap: parseBoolean(process.env.ALLOW_BOOTSTRAP, false),
  bootstrapKey: process.env.BOOTSTRAP_KEY || "",
  whatsappApiUrl: process.env.WHATSAPP_API_URL || "",
  whatsappApiToken: process.env.WHATSAPP_API_TOKEN || "",
  whatsappSender: process.env.WHATSAPP_SENDER || "Bimbel",
  qrSecret: process.env.QR_SECRET,
  qrExpiresMinutes: Number(process.env.QR_EXPIRES_MINUTES || 120)
};