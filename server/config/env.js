import dotenv from 'dotenv';

dotenv.config();

export const PORT = process.env.PORT || 8080;
export const ALLOWED_USER_EMAILS = process.env.ALLOWED_USER_EMAILS || '';
