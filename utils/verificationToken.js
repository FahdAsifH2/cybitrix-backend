import crypto from "crypto";

export const generateVerificationToken = () => crypto.randomInt(100000, 999999);

export const generatePwdToken = () => crypto.randomBytes(64).toString("hex");

export const expiry = (time) => new Date(Date.now() + time * 1000);
