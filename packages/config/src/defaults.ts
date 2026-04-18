import { SettingsSchema, type Settings } from './schema.js';

export const defaultSettings: Settings = SettingsSchema.parse({});
