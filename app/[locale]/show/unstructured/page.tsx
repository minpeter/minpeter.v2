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
          {/* 배경: 기본 상태에는 -rotate-1, 호버시 정렬 (rotate-0) */}
          <div className="absolute inset-0 -rotate-1 transform rounded-sm bg-neutral-600 transition-all duration-300 group-hover:rotate-0" />
          {/* 내용: 기본 상태에는 rotate-1, 호버시 정렬 (rotate-0) */}
          <div className="absolute inset-0 rotate-1 transform rounded-sm bg-neutral-500 p-8 transition-all duration-300 group-hover:rotate-0">
            <h1 className="text-2xl font-extrabold text-neutral-200">
              Hover me
            </h1>
          </div>
        </div>
      </div>

      {/* Enhanced 3D layered animated card with twisting effect */}
      <div className="h-48 w-full [perspective:1500px]">
        <div className="group relative h-full w-full cursor-pointer">
          <div className="absolute inset-0 flex transform items-center justify-center rounded-sm bg-neutral-600 transition-all duration-500 ease-out group-hover:[transform:translate3d(-15px,-15px,40px)_rotateX(10deg)_rotateY(-5deg)]">
            <span className="text-2xl font-extrabold text-white drop-shadow-md">
              Layer 1
            </span>
          </div>
          <div className="absolute inset-0 flex transform items-center justify-center rounded-sm bg-neutral-500 transition-all duration-500 ease-out group-hover:[transform:translate3d(0px,0px,20px)_rotateX(5deg)_rotateY(-3deg)]">
            <span className="text-2xl font-extrabold text-white drop-shadow-md">
              Layer 2
            </span>
          </div>
          <div className="absolute inset-0 flex transform items-center justify-center rounded-sm bg-neutral-400 transition-all duration-500 ease-out group-hover:[transform:translate3d(15px,15px,-10px)_rotateX(-5deg)_rotateY(-8deg)]">
            <span className="text-2xl font-extrabold text-white drop-shadow-md">
              Layer 3
            </span>
          </div>
        </div>
      </div>

      {/* Side-view transition with layer separation effect */}
      <div className="h-48 w-full [perspective:1500px]">
        <div className="group relative h-full w-full cursor-pointer">
          {/* Front layer - largest */}
          <div className="absolute inset-0 origin-left transform rounded-sm bg-neutral-700 shadow-lg transition-all duration-700 ease-out group-hover:[transform:rotateY(30deg)_translateZ(20px)]">
            <div className="flex h-full items-center justify-center">
              <span className="text-2xl font-extrabold text-white drop-shadow-md">
                Front
              </span>
            </div>
          </div>

          {/* Middle layer - smaller with padding */}
          <div className="absolute inset-0 origin-left transform rounded-sm bg-neutral-600 shadow-lg transition-all duration-700 ease-out group-hover:inset-2 group-hover:[transform:rotateY(30deg)_translateZ(100px)]">
            <div className="flex h-full items-center justify-center">
              <span className="text-xl font-extrabold text-white opacity-0 drop-shadow-md transition-opacity delay-100 duration-300 group-hover:opacity-100">
                Middle
              </span>
            </div>
          </div>

          {/* Back layer 1 - much smaller */}
          <div className="absolute inset-x-4 inset-y-6 flex origin-left transform flex-row gap-6 rounded-sm p-3 transition-all duration-700 ease-out group-hover:[transform:rotateY(30deg)_translateZ(250px)]">
            <div className="flex h-full w-1/2 items-center justify-center bg-neutral-500">
              <span className="text-lg font-extrabold text-white opacity-0 drop-shadow-md transition-opacity delay-200 duration-300 group-hover:opacity-100">
                Back 1
              </span>
            </div>
            <div className="flex h-full w-1/2 items-center justify-center bg-neutral-400">
              <span className="text-lg font-extrabold text-white opacity-0 drop-shadow-md transition-opacity delay-300 duration-300 group-hover:opacity-100">
                Back 2
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
