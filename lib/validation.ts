import { z } from 'zod';
export const configSchema = z.object({
  architecture: z.enum(['courtyard','pavilion','alpine']),
  plants: z.enum(['pine','olive','cypress']),
  time: z.enum(['day','sunset','night']), weather: z.enum(['clear','rain']),
  carColor: z.string().regex(/^#[0-9a-f]{6}$/i), wheels: z.enum(['silver','black']),
});
export const homeSchema = z.object({
  id: z.string().uuid().nullable().optional(),
  title: z.string().trim().min(1).max(50),
  ownerName: z.string().trim().min(1).max(30),
  story: z.string().trim().max(800), config: configSchema,
});
export const postcardSchema = z.object({
  homeId: z.string().uuid(), name: z.string().trim().min(1).max(30),
  message: z.string().trim().min(1).max(300),
  theme: z.enum(['forest','sunset','cream','sage','sand','night','山野','落日','旅途']).default('forest'),
});
export const designSchema = z.object({prompt: z.string().trim().min(1).max(500), config:configSchema});
