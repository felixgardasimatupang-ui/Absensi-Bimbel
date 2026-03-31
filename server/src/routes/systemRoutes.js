import express from "express";
import { requireAuth } from "../middleware.js";
import { getRoleAccess, roleAccessMap } from "../permissions.js";
import asyncHandler from "../utils/asyncHandler.js";

const router = express.Router();

router.get("/health", (_req, res) => {
    res.json({ ok: true, timestamp: new Date().toISOString() });
});

router.get("/roles/access", requireAuth, asyncHandler(async (req, res) => {
    res.json({
        currentRole: req.user.role,
        currentAccess: getRoleAccess(req.user.role),
        allRoles: roleAccessMap
    });
}));

export default router;