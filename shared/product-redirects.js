/** Explicit next-intl prefixes; query parameters pass through Next's 308 redirects. */
export const productRedirects = ["", "/ko", "/en", "/ja"].map((prefix) => ({
  destination: `${prefix}/products/maru60`,
  permanent: true,
  source: `${prefix}/products/rule60-hhkb-unibody`,
}));
