import { describe, expect, it } from 'vitest';
import { SettingsSchema, defaultSettings } from '../src/index.js';

describe('SettingsSchema', () => {
  it('parses empty object into defaults', () => {
    const parsed = SettingsSchema.parse({});
    expect(parsed.workerPort).toBe(37777);
    expect(parsed.compression.intensity).toBe('full');
  });

  it('rejects invalid intensity', () => {
    expect(() => SettingsSchema.parse({ compression: { intensity: 'xxx' } })).toThrow();
  });

  it('defaults match exported defaultSettings', () => {
    expect(defaultSettings.workerPort).toBe(37777);
    expect(defaultSettings.embedding.provider).toBe('local');
  });
});
