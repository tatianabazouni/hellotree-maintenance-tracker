import 'dotenv/config';

const localhostPattern = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;

function parseCorsOrigins(value: string | undefined) {
  return value
    ?.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

export const config = {
  port: Number(process.env.PORT ?? 3000),
  corsOrigins: parseCorsOrigins(process.env.CORS_ORIGIN),
  allowLocalhostCors: process.env.NODE_ENV !== 'production',
  isProduction: process.env.NODE_ENV === 'production',
};

export function isAllowedCorsOrigin(origin: string | undefined) {
  if (!origin) return true;
  if (config.corsOrigins?.includes(origin)) return true;
  return config.allowLocalhostCors && localhostPattern.test(origin);
}

export function validateConfig() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL must be set');
}
