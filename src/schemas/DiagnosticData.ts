import z from 'zod';

export const DiagnosticData = z.object({
  title: z.string(),
  description: z.string(),
  symptoms: z.string(),
  diagnosis: z.string(),
  treatment: z.string(),
  observations: z.string().optional(),
  nextAppointment: z.coerce.date().optional(),
});

export const DiagnosticDataUpdate = DiagnosticData.partial();

export type DiagnosticDataUpdateType = z.infer<typeof DiagnosticDataUpdate>;

export type DiagnosticDataType = z.infer<typeof DiagnosticData>;
