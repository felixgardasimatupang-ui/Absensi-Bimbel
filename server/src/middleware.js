import rateLimit from "express-rate-limit";
import jwt from "jsonwebtoken";
import { ZodError } from "zod";
import { config } from "./config.js";
import { verifyToken } from "./auth.js";
import { prisma } from "./db.js";

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: "Terlalu banyak permintaan, silakan coba lagi beberapa saat."
  }
});

export const authLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: "Percobaan login terlalu sering. Tunggu beberapa menit."
  }
});

export const validate =
  (schema) =>
  (req, res, next) => {
    try {
      req.validatedBody = schema.parse(req.body);
      next();
    } catch (error) {
      next(error);
    }
  };

const extractBearerToken = (authorizationHeader) => {
  if (!authorizationHeader?.startsWith("Bearer ")) {
    return null;
  }

  return authorizationHeader.slice("Bearer ".length).trim() || null;
};

const isTrustedOrigin = (value) => {
  if (!value) {
    return false;
  }

  try {
    const origin = new URL(value).origin;
    return config.allowedOrigins.includes(origin);
  } catch (_error) {
    return config.allowedOrigins.includes(value);
  }
};

export const enforceTrustedOrigin = (req, res, next) => {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) {
    return next();
  }

  const hasCookieToken = Boolean(req.cookies?.[config.cookieName]);

  if (!hasCookieToken) {
    return next();
  }

  if (isTrustedOrigin(req.get("origin")) || isTrustedOrigin(req.get("referer"))) {
    return next();
  }

  return res.status(403).json({
    message: "Origin permintaan tidak diizinkan."
  });
};

export const requireAuth = async (req, res, next) => {
  try {
    const bearerToken = extractBearerToken(req.get("authorization"));
    const cookieToken = req.cookies?.[config.cookieName];
    const token = bearerToken || cookieToken;

    if (!token) {
      return res.status(401).json({ message: "Sesi tidak ditemukan." });
    }

    const payload = verifyToken(token);
    const user = await prisma.user.findUnique({
      where: { id: payload.sub }
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ message: "Akses tidak valid." });
    }

    req.user = user;
    req.authMethod = bearerToken ? "bearer" : "cookie";
    next();
  } catch (error) {
    next(error);
  }
};

export const requireRole = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({ message: "Anda tidak memiliki izin." });
  }

  next();
};

export const notFoundHandler = (_req, res) => {
  res.status(404).json({ message: "Endpoint tidak ditemukan." });
};

export const errorHandler = (error, _req, res, _next) => {
  if (error instanceof ZodError) {
    return res.status(400).json({
      message: "Validasi gagal.",
      errors: error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message
      }))
    });
  }

  if (error instanceof SyntaxError && "body" in error) {
    return res.status(400).json({
      message: "Format JSON tidak valid."
    });
  }

  if (error instanceof jwt.TokenExpiredError) {
    return res.status(401).json({
      message: "Sesi login sudah berakhir."
    });
  }

  if (error instanceof jwt.JsonWebTokenError) {
    return res.status(401).json({
      message: "Token autentikasi tidak valid."
    });
  }

  if (error?.code === "P2002") {
    return res.status(409).json({ message: "Data sudah digunakan." });
  }

  console.error(error);

  return res.status(500).json({
    message: "Terjadi kesalahan pada server."
  });
};
