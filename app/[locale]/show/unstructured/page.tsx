import Header from "@/components/header";
import { cn } from "@/lib/utils";

export default function Page() {
  return (
    <section className="flex flex-col gap-3">
      <Header
        title="/show/unstructured"
        link={{ href: "/show", text: "Back" }}
        description="unstructured"
      />

      <div className="h-96 w-full rounded-md bg-neutral-800 p-4 text-black">
        <div className="relative h-full w-full">
          <div className="absolute top-0 right-0 bottom-4 left-4 bg-neutral-600" />
          <div className="absolute top-4 right-4 bottom-0 left-0 bg-neutral-500 p-8">
            <h1 className="text-2xl font-extrabold text-neutral-200">
              hello unstructured
            </h1>
          </div>
        </div>
      </div>
    </section>
  );
}
