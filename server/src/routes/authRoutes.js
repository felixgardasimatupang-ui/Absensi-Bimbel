import express from "express";
import { config } from "../config.js";
import { comparePassword, hashPassword, signToken } from "../auth.js";
import { prisma } from "../db.js";
import { validate, requireAuth, authLimiter } from "../middleware.js";
import { loginSchema } from "../validators.js";
import asyncHandler from "../utils/asyncHandler.js";

const router = express.Router();

const defaultSecrets = new Set([
    "change-this-to-a-long-random-secret",
    "change-this-to-another-random-secret",
    "change-this-too"
]);

const isMobileClient = (req) => req.get("x-client-platform") === "mobile";
const hasWeakSecrets =
    defaultSecrets.has(config.jwtSecret) || defaultSecrets.has(config.qrSecret);

const buildCookieOptions = () => ({
    httpOnly: true,
    secure: config.cookieSecure,
    sameSite: config.cookieSameSite,
    path: "/",
    maxAge: 8 * 60 * 60 * 1000
});

const serializeAuthUser = (user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    access: user.access
});

router.post("/bootstrap", asyncHandler(async (req, res) => {
    if (!config.allowBootstrap) {
        return res.status(403).json({
            message: "Bootstrap dinonaktifkan. Aktifkan ALLOW_BOOTSTRAP=true untuk setup awal."
        });
    }

    if (config.bootstrapKey && req.get("x-bootstrap-key") !== config.bootstrapKey) {
        return res.status(403).json({
            message: "Bootstrap key tidak valid."
        });
    }

    const totalUsers = await prisma.user.count();

    if (totalUsers > 0) {
        return res.status(403).json({
            message: "Bootstrap hanya tersedia saat aplikasi pertama kali dijalankan."
        });
    }

    const admin = await prisma.user.create({
        data: {
            name: process.env.ADMIN_NAME || "Super Admin",
            email: process.env.ADMIN_EMAIL || "admin@bimbel.local",
            passwordHash: await hashPassword(process.env.ADMIN_PASSWORD || "ChangeMe123!"),
            role: "SUPER_ADMIN"
        }
    });

    res.status(201).json({
        message: "Akun admin awal berhasil dibuat.",
        user: {
            id: admin.id,
            name: admin.name,
            email: admin.email,
            role: admin.role
        }
    });
}));

router.post("/login", authLimiter, validate(loginSchema), asyncHandler(async (req, res) => {
    if (hasWeakSecrets) {
        return res.status(503).json({
            message: "Server belum aman. Ganti JWT_SECRET dan QR_SECRET sebelum login."
        });
    }

    const { email, password } = req.validatedBody;
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || !user.isActive) {
        return res.status(401).json({ message: "Email atau password salah." });
    }

    const isValid = await comparePassword(password, user.passwordHash);

    if (!isValid) {
        return res.status(401).json({ message: "Email atau password salah." });
    }

    const token = signToken(user);
    res.cookie(config.cookieName, token, buildCookieOptions());
    const payload = {
        message: "Login berhasil.",
        user: serializeAuthUser(user),
        authMode: isMobileClient(req) ? "bearer" : "cookie"
    };

    if (isMobileClient(req)) {
        payload.token = token;
    }

    res.json(payload);
}));

router.post("/logout", requireAuth, (req, res) => {
    res.clearCookie(config.cookieName, buildCookieOptions());
    res.json({ message: "Logout berhasil." });
});

router.get("/me", requireAuth, (req, res) => {
    res.json({
        user: serializeAuthUser(req.user),
        authMode: req.authMethod
    });
});

export default router;