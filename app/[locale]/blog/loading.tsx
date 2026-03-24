import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="flex flex-col gap-2">
      <Skeleton className="mb-6 h-8 w-48" />
      <Skeleton className="mb-8 h-4 w-32" />
      
      {Array.from({ length: 3 }).map((_, i) => (
        <div className="flex flex-col gap-2 border-t py-8 sm:flex-row" key={`year-group-${i}`}>
          <Skeleton className="h-6 w-16" />
          <div className="flex w-full flex-col gap-3">
            {Array.from({ length: 2 }).map((_, j) => (
              <div className="flex justify-between" key={`post-${i}-${j}`}>
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-5 w-16" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
