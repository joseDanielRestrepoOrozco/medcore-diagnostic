import dotenv from 'dotenv';
dotenv.config();

export const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
export const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL;
export const USERS_SERVICE_URL =
  process.env.USERS_SERVICE_URL || 'http://localhost:3002';
export const PATIENTS_SERVICE_URL =
  process.env.PATIENTS_SERVICE_URL || 'http://localhost:3003';
