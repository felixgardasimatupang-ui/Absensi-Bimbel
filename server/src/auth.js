import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { config } from "./config.js";

export const hashPassword = async (password) => bcrypt.hash(password, 12);

export const comparePassword = async (password, hash) =>
  bcrypt.compare(password, hash);

export const signToken = (user) =>
  jwt.sign(
    {
      sub: user.id,
      role: user.role,
      email: user.email,
      name: user.name
    },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn }
  );

export const verifyToken = (token) => jwt.verify(token, config.jwtSecret);
