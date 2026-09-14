import 'dotenv/config';
export const config = {
  port: Number(process.env.PORT ?? 3000),
  jwtSecret: process.env.JWT_SECRET ?? '',
  corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
  isProduction: process.env.NODE_ENV === 'production',
};
export function validateConfig() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL must be set');
  if (!process.env.JWT_SECRET || config.jwtSecret.length < 32)
    throw new Error('JWT_SECRET must be set to at least 32 characters');
}
