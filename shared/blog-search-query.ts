export const MAX_BLOG_QUERY_CODE_POINTS = 200;

export function limitBlogQuery(query: string): string {
  return Array.from(query).slice(0, MAX_BLOG_QUERY_CODE_POINTS).join("");
}

export function normalizeBlogQuery(query: string): string {
  return limitBlogQuery(query.trim());
}
