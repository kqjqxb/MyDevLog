import { z } from 'zod';

import { TASK_PRIORITIES, TASK_STATUSES } from '@/shared/types';

/** Zod schema backing the create/edit form via react-hook-form. */
export const taskFormSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, 'Title must be at least 3 characters')
    .max(80, 'Title must be under 80 characters'),
  description: z.string().trim().max(500, 'Description is too long').optional(),
  status: z.enum(TASK_STATUSES as unknown as [string, ...string[]]),
  priority: z.enum(TASK_PRIORITIES as unknown as [string, ...string[]]),
  notes: z.string().trim().max(1000, 'Notes are too long').optional(),
});

export type TaskFormValues = z.infer<typeof taskFormSchema>;
