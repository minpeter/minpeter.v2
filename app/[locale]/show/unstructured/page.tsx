import Header from "@/components/header";

export default function Page() {
  return (
    <section className="flex flex-col gap-8">
      <Header
        title="/show/unstructured"
        link={{ href: "/show", text: "Back" }}
        description="unstructured"
      />

      <div className="h-48 w-full">
        <div className="group relative h-full w-full cursor-pointer">
          <div className="absolute top-0 right-0 bottom-4 left-4 rounded-sm bg-neutral-600 transition-all duration-300 group-hover:bottom-0 group-hover:left-0" />
          <div className="absolute top-4 right-4 bottom-0 left-0 rounded-sm bg-neutral-500 p-8 transition-all duration-300 group-hover:top-0 group-hover:right-0">
            <h1 className="text-2xl font-extrabold text-neutral-200">
              Hover your mouse over me
            </h1>
          </div>
        </div>
      </div>

      <div className="h-48 w-full">
        <div className="group relative h-full w-full cursor-pointer">
          {/* 배경: 기본 상태에는 -rotate-1, 클릭시 정렬 (rotate-0) */}
          <div className="absolute inset-0 -rotate-1 transform rounded-sm bg-neutral-600 transition-all duration-300 group-active:rotate-0" />
          {/* 내용: 기본 상태에는 rotate-1, 클릭시 정렬 (rotate-0) */}
          <div className="absolute inset-0 rotate-1 transform rounded-sm bg-neutral-500 p-8 transition-all duration-300 group-active:rotate-0">
            <h1 className="text-2xl font-extrabold text-neutral-200">
              Click me
            </h1>
          </div>
        </div>
      </div>
    </section>
  );
}
