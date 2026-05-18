import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    date: z.string(),
    description: z.string().optional(),
    slug: z.string(),
    series: z.string().optional(),
    seriesOrder: z.number().optional(),
  }),
});

const books = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/books' }),
  schema: z.object({
    title: z.string(),
    subtitle: z.string().optional(),
    motto: z.string().optional(),
    description: z.string(),
    cover: z.string(),
    seriesName: z.string(),
    order: z.number().default(0),
  }),
});

export const collections = { blog, books };
