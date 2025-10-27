"use client";

import {
  Environment,
  MeshTransmissionMaterial,
  Text,
  useGLTF,
} from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Suspense, useRef } from "react";

// Preload the GLTF file
if (typeof window !== "undefined") {
  useGLTF.preload("/Lickitung.gltf", true);
}

const calculateAspectRatio = (ratio: string) => {
  const [width, height] = ratio.split("/").map(Number);
  return `${(height / width) * 100}%`;
};

export default function Lickitung({ aspect = "3/2" }) {
  return (
    <div
      className="relative w-full"
      style={{ paddingTop: calculateAspectRatio(aspect) }}
    >
      <div className="absolute inset-0">
        <Canvas
          camera={{ fov: 1 }}
          dpr={[0.7, 1.5]}
          gl={{
            powerPreference: "high-performance",
            antialias: false, // 안티앨리어싱 비활성화
          }} // 디바이스 픽셀 비율 하향 조정
          performance={{ min: 0.5 }} // 최소 성능 임계값 증가
          style={{
            width: "100%",
            height: "100%",
            display: "block",
          }}
        >
          <Suspense fallback={null}>
            <Model />
            <directionalLight intensity={2} position={[0, 2, 3]} />
            <Environment files="/studio_small_03_1k.hdr" />
          </Suspense>
        </Canvas>
      </div>
    </div>
  );
}

export function Model() {
  const { nodes } = useGLTF("/Lickitung.gltf", true); // draco 압축 활성화

  const { viewport } = useThree();

  const torus = useRef(null);

  const materialProps = {
    thickness: 1.1,
    roughness: 0.4,
    transmission: 1,
    ior: 1.2,
    chromaticAberration: 0.7,
    backside: true,
  };

  useFrame(() => {
    // eslint-disable-next-line
    // @ts-expect-error
    torus.current.rotation.z += 0.02;
  });

  return (
    <group scale={viewport.width / 20}>
      <Text
        anchorX="center"
        anchorY="middle"
        color="white"
        fillOpacity={0.7}
        fontSize={0.7}
        position={[0, 0, -20]}
        // opacity={0.7} // 텍스트 투명도 조정
        textAlign="center"
      >
        {"VUD ❤️\n\nflag{1ICK17un6_1o8-2}\n\nNULL"}
      </Text>

      <mesh
        castShadow={false}
        // eslint-disable-next-line
        // @ts-expect-error
        frustumCulled={true}
        geometry={nodes.mesh_0.geometry}
        position={[0, -6, 0]}
        receiveShadow={false} // 시야 밖 렌더링 방지
        ref={torus} // 그림자 비활성화
        rotation={[-Math.PI / -2, 0, 0]}
      >
        <MeshTransmissionMaterial
          {...materialProps}
          clearcoat={0.1} // 약간의 자체 발광 추가
          emissiveIntensity={0.2} // 광택 추가
        />
      </mesh>
    </group>
  );
}
