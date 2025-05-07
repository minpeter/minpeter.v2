// "use client";

// import { useQueryState, parseAsString } from "nuqs";
// import { blog, blogType } from "@/lib/source";

// import { MagnifyingGlassIcon } from "@radix-ui/react-icons";

// export function BlogSearch({ lang }: { lang: string }) {
//   const posts = blog.getPages(lang);

//   const [query, setQuery] = useQueryState(
//     "q",
//     parseAsString.withDefault(lang == "en" ? "(en)" : "")
//   );

//   const searchIn = (text?: string) =>
//     text?.toLowerCase().includes(query.toLowerCase());

//   const filteredPosts = posts.filter((post: blogType) =>
//     searchIn(post?.data.title)
//   );
//   filteredPosts.sort(
//     (a, b) => new Date(b.data.date).getTime() - new Date(a.data.date).getTime()
//   );

//   return (
//     <BlogSearchFallback
//       onChangehandler={(e) => setQuery(e.target.value)}
//       query={query}
//       disabled={false}
//     />
//   );
// }

// export function BlogSearchFallback({
//   onChangehandler,
//   query,
//   disabled = true,
// }: {
//   onChangehandler?: (e: React.ChangeEvent<HTMLInputElement>) => void;
//   query?: string;
//   disabled?: boolean;
// }) {
//   return (
//     <div className="relative flex flex-1 shrink-0">
//       <label htmlFor="search" className="sr-only">
//         Search
//       </label>
//       <input
//         className="w-full rounded-md border py-[9px] pl-10 text-sm outline-hidden placeholder:text-gray-500 focus:outline-hidden"
//         placeholder="Search blog posts..."
//         onChange={onChangehandler}
//         value={query}
//         disabled={disabled}
//       />
//       <MagnifyingGlassIcon className="absolute top-1/2 left-3 h-[18px] w-[18px] -translate-y-1/2 text-gray-500" />
//     </div>
//   );
// }
