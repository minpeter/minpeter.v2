import { createFromSource } from "fumadocs-core/search/server";

import { blog } from "@/shared/source";

export const { GET } = createFromSource(blog);
