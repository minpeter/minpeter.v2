import { remarkInstall } from "fumadocs-docgen";
import {
  defineConfig,
  defineDocs,
  frontmatterSchema,
} from "fumadocs-mdx/config";
import type { DefaultMDXOptions } from "fumadocs-mdx/config";
import lastModified from "fumadocs-mdx/plugins/last-modified";
import { z } from "zod";

import { parseFrontmatterDate } from "./shared/frontmatter-date";
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
          return parseFrontmatterDate(value, context);
        }),
      external_url: z.url().optional(),
      lang: z
        .array(z.enum(routing.locales))
        .optional()
        .default([routing.defaultLocale]),
      machine_translated: z.boolean().optional().default(false),
      published: z.string().or(z.date()).transform(parseFrontmatterDate),
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
