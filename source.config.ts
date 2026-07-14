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
      draft: z.boolean().optional().default(false),
      drafted: z
        .string()
        .or(z.date())
        .optional()
        .transform((value, context) => {
          if (value === undefined) {
            return;
          }
          try {
            return new Date(value);
          } catch {
            context.addIssue({
              code: z.ZodIssueCode.custom,
              message: "Invalid date",
            });
            return z.NEVER;
          }
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
          try {
            return new Date(value);
          } catch {
            context.addIssue({
              code: z.ZodIssueCode.custom,
              message: "Invalid date",
            });
            return z.NEVER;
          }
        }),
    }),
  },
});

const mdxOptions: DefaultMDXOptions = {
  development: process.env.NODE_ENV === "development",
  rehypePlugins: (v) => [...v],
  remarkPlugins: [remarkInstall],
};

export default defineConfig({
  mdxOptions,
  plugins: [lastModified()],
  // generateManifest: false,
});
