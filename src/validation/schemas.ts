import { z } from 'zod';
export const loginSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(1).max(200),
});
export const createRequestSchema = z
  .object({
    title: z.string().trim().min(3).max(160),
    description: z.string().trim().min(10).max(2000),
  })
  .strict();
export const statusSchema = z
  .object({
    status: z.enum(['NEW', 'IN_PROGRESS', 'DONE']),
    resolutionNote: z.string().trim().min(1).max(2000).optional(),
  })
  .strict();
export const requestIdSchema = z.object({ id: z.string().uuid() });
export const adminFiltersSchema = z
  .object({
    status: z.enum(['NEW', 'IN_PROGRESS', 'DONE']).optional(),
    clientId: z.string().uuid().optional(),
  })
  .strict();
