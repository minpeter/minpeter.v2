import { remarkInstall } from "fumadocs-docgen";
import {
  defineConfig,
  defineDocs,
  frontmatterSchema,
} from "fumadocs-mdx/config";
import type { DefaultMDXOptions } from "fumadocs-mdx/config";
import lastModified from "fumadocs-mdx/plugins/last-modified";
import { z } from "zod";

import { routing } from "./shared/i18n/routing";

export const { docs, meta } = defineDocs({
  dir: "content/blog",
  docs: {
    postprocess: {
      includeProcessedMarkdown: true,
    },
    schema: frontmatterSchema.extend({
      ai_generated_by: z.string().optional(),
      draft: z.boolean().optional().default(false),
      drafted: z
        .string()
        .or(z.date())
        .optional()
        .transform((value, context) => {
          if (value === undefined) {
            return;
          }
          const date = new Date(value);
          if (Number.isNaN(date.getTime())) {
            context.addIssue({
              code: z.ZodIssueCode.custom,
              message: "Invalid date",
            });
            return z.NEVER;
          }
          return date;
        }),
      external_url: z.url().optional(),
      lang: z
        .array(z.enum(routing.locales))
        .optional()
        .default([routing.defaultLocale]),
      machine_translated: z.boolean().optional().default(false),
      published: z
        .string()
        .or(z.date())
        .transform((value, context) => {
          const date = new Date(value);
          if (Number.isNaN(date.getTime())) {
            context.addIssue({
              code: z.ZodIssueCode.custom,
              message: "Invalid date",
            });
            return z.NEVER;
          }
          return date;
        }),
    }),
  },
});

const mdxOptions: DefaultMDXOptions = {
  development: process.env.NODE_ENV === "development",
  remarkPlugins: [remarkInstall],
};

export default defineConfig({
  mdxOptions,
  plugins: [lastModified()],
});
