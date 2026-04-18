import { z } from 'zod';

export const CompressionIntensity = z.enum(['lite', 'full', 'ultra']);
export type CompressionIntensity = z.infer<typeof CompressionIntensity>;

export const EmbeddingProvider = z.enum(['local', 'ollama', 'openai', 'none']);
export type EmbeddingProvider = z.infer<typeof EmbeddingProvider>;

export const SettingsSchema = z
  .object({
    dataDir: z.string().default('~/.caveman-mem'),
    workerPort: z.number().int().positive().default(37777),
    logLevel: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
    compression: z
      .object({
        intensity: CompressionIntensity.default('full'),
        expandForModel: z.boolean().default(false),
      })
      .default({ intensity: 'full', expandForModel: false }),
    embedding: z
      .object({
        provider: EmbeddingProvider.default('local'),
        model: z.string().default('Xenova/all-MiniLM-L6-v2'),
        endpoint: z.string().optional(),
        apiKey: z.string().optional(),
      })
      .default({ provider: 'local', model: 'Xenova/all-MiniLM-L6-v2' }),
    search: z
      .object({
        alpha: z.number().min(0).max(1).default(0.5),
        defaultLimit: z.number().int().positive().default(10),
      })
      .default({ alpha: 0.5, defaultLimit: 10 }),
    privacy: z
      .object({
        excludePatterns: z.array(z.string()).default([]),
        redactSecrets: z.boolean().default(true),
      })
      .default({ excludePatterns: [], redactSecrets: true }),
    ides: z.record(z.string(), z.boolean()).default({}),
  })
  .strict();

export type Settings = z.infer<typeof SettingsSchema>;
