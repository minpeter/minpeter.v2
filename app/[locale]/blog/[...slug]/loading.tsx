import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="flex flex-col gap-4">
      <Skeleton className="h-10 w-3/4" />
      <Skeleton className="h-4 w-48" />
      
      <div className="mt-8 flex flex-col gap-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton className={`h-4 ${i % 3 === 2 ? "w-2/3" : "w-full"}`} key={`paragraph-${i}`} />
        ))}
      </div>
    </div>
  )
}
