
import { z } from 'zod';
import { insertUploadSchema, uploads } from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

export const api = {
  uploads: {
    list: {
      method: 'GET' as const,
      path: '/api/uploads' as const,
      responses: {
        200: z.array(z.custom<typeof uploads.$inferSelect>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/uploads/:id' as const,
      responses: {
        200: z.custom<typeof uploads.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/uploads' as const,
      // Input is FormData, not JSON, so we don't strictly validate body here 
      // but we describe the response
      responses: {
        201: z.custom<typeof uploads.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    process: {
      method: 'POST' as const,
      path: '/api/uploads/:id/process' as const,
      responses: {
        200: z.custom<typeof uploads.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    }
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
