import { z } from 'zod';

export const userSchema = z.object({
  id: z.string(),
  email: z.email(),
  fullname: z.string(),
  role: z.string(),
  status: z.string(),
  specialization: z.string().nullable().optional(),
  department: z.string().nullable().optional(),
  license_number: z.string().nullable().optional(),
});

export type User = z.infer<typeof userSchema>;
