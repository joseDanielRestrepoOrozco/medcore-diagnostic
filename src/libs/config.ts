import dotenv from 'dotenv';
dotenv.config();

export const PORT = process.env.PORT || '3000';
export const DATABASE_URL = process.env.DATABASE_URL || '';
export const AUTH_SERVICE_URL =
  process.env.AUTH_SERVICE_URL || 'http://localhost:3001';
export const USERS_SERVICE_URL =
  process.env.USERS_SERVICE_URL || 'http://localhost:3002';
export const NODE_ENV = process.env.NODE_ENV || 'development';
