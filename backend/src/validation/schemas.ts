import { z } from 'zod';
export const createRequestSchema = z
  .object({
    title: z.string().trim().min(3).max(160),
    description: z.string().trim().min(10).max(2000),
    priority: z.enum(['LOW', 'NORMAL', 'URGENT']),
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
