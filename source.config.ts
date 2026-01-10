import { remarkInstall } from "fumadocs-docgen";
import {
  type DefaultMDXOptions,
  defineConfig,
  defineDocs,
  frontmatterSchema,
} from "fumadocs-mdx/config";
import lastModified from "fumadocs-mdx/plugins/last-modified";
import { z } from "zod";
import { routing } from "./shared/i18n/routing";

export const { docs, meta } = defineDocs({
  dir: "content/blog",
  docs: {
    schema: frontmatterSchema.extend({
      draft: z.boolean().optional().default(false),
      date: z
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
      external_url: z.string().url().optional(),
      lang: z
        .array(z.enum(routing.locales))
        .optional()
        .default([routing.defaultLocale]),
      machine_translated: z.boolean().optional().default(false),
    }),
    postprocess: {
      includeProcessedMarkdown: true,
    },
  },
});

const mdxOptions: DefaultMDXOptions = {
  remarkPlugins: [remarkInstall],
  rehypePlugins: (v) => [...v],
  development: process.env.NODE_ENV === "development",
};

export default defineConfig({
  mdxOptions,
  plugins: [lastModified()],
  // generateManifest: false,
});
