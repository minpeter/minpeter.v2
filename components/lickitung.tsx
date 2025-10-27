"use client";

import {
  Environment,
  MeshTransmissionMaterial,
  Text,
  useGLTF,
} from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Suspense, useRef } from "react";
import type { BufferGeometry } from "three";

// Preload the GLTF file
if (typeof window !== "undefined") {
  useGLTF.preload("/Lickitung.gltf", true);
}

const PERCENTAGE_MULTIPLIER = 100;
const CAMERA_FIELD_OF_VIEW = 1;
const DEVICE_PIXEL_RATIO_MIN = 0.7;
const DEVICE_PIXEL_RATIO_MAX = 1.5;
const PERFORMANCE_MINIMUM = 0.5;
const DIRECTIONAL_LIGHT_INTENSITY = 2;
const DIRECTIONAL_LIGHT_POSITION_X = 0;
const DIRECTIONAL_LIGHT_POSITION_Y = 2;
const DIRECTIONAL_LIGHT_POSITION_Z = 3;
const DIRECTIONAL_LIGHT_POSITION: [number, number, number] = [
  DIRECTIONAL_LIGHT_POSITION_X,
  DIRECTIONAL_LIGHT_POSITION_Y,
  DIRECTIONAL_LIGHT_POSITION_Z,
];
const ROTATION_INCREMENT = 0.02;
const VIEWPORT_SCALE_DIVISOR = 20;
const TEXT_FILL_OPACITY = 0.7;
const TEXT_FONT_SIZE = 0.7;
const TEXT_POSITION_Z = -20;
const TEXT_POSITION: [number, number, number] = [0, 0, TEXT_POSITION_Z];
const MESH_VERTICAL_OFFSET = -6;
const MESH_POSITION: [number, number, number] = [0, MESH_VERTICAL_OFFSET, 0];
const MESH_ROTATION_X = Math.PI / 2;
const MATERIAL_THICKNESS = 1.1;
const MATERIAL_ROUGHNESS = 0.4;
const MATERIAL_TRANSMISSION = 1;
const MATERIAL_IOR = 1.2;
const MATERIAL_CHROMATIC_ABERRATION = 0.7;
const MATERIAL_CLEARCOAT = 0.1;
const MATERIAL_EMISSIVE_INTENSITY = 0.4;

type LickitungGLTF = {
  nodes: {
    mesh_0: {
      geometry: BufferGeometry;
    };
  };
};

type Rotatable = {
  rotation: {
    z: number;
  };
};

const calculateAspectRatio = (ratio: string) => {
  const [width, height] = ratio.split("/").map(Number);
  return `${(height / width) * PERCENTAGE_MULTIPLIER}%`;
};

export default function Lickitung({ aspect = "3/2" }) {
  return (
    <div
      className="relative w-full"
      style={{ paddingTop: calculateAspectRatio(aspect) }}
    >
      <div className="absolute inset-0">
        <Canvas
          camera={{ fov: CAMERA_FIELD_OF_VIEW }}
          dpr={[DEVICE_PIXEL_RATIO_MIN, DEVICE_PIXEL_RATIO_MAX]}
          gl={{
            powerPreference: "high-performance",
            antialias: false, // 안티앨리어싱 비활성화
          }} // 디바이스 픽셀 비율 하향 조정
          performance={{ min: PERFORMANCE_MINIMUM }} // 최소 성능 임계값 증가
          style={{
            width: "100%",
            height: "100%",
            display: "block",
          }}
        >
          <Suspense fallback={null}>
            <Model />
            <directionalLight
              intensity={DIRECTIONAL_LIGHT_INTENSITY}
              position={DIRECTIONAL_LIGHT_POSITION}
            />
            <Environment files="/studio_small_03_1k.hdr" />
          </Suspense>
        </Canvas>
      </div>
    </div>
  );
}

export function Model() {
  const { nodes } = useGLTF(
    "/Lickitung.gltf",
    true
  ) as unknown as LickitungGLTF; // draco 압축 활성화

  const { viewport } = useThree();

  const torus = useRef<Rotatable | null>(null);

  const materialProps = {
    thickness: MATERIAL_THICKNESS,
    roughness: MATERIAL_ROUGHNESS,
    transmission: MATERIAL_TRANSMISSION,
    ior: MATERIAL_IOR,
    chromaticAberration: MATERIAL_CHROMATIC_ABERRATION,
    backside: true,
  };

  useFrame(() => {
    if (!torus.current) {
      return;
    }

    torus.current.rotation.z += ROTATION_INCREMENT;
  });

  return (
    <group scale={viewport.width / VIEWPORT_SCALE_DIVISOR}>
      <Text
        anchorX="center"
        anchorY="middle"
        color="white"
        fillOpacity={TEXT_FILL_OPACITY}
        fontSize={TEXT_FONT_SIZE}
        position={TEXT_POSITION}
        // opacity={0.7} // 텍스트 투명도 조정
        textAlign="center"
      >
        {"VUD ❤️\n\nflag{1ICK17un6_1o8-2}\n\nNULL"}
      </Text>

      <mesh
        castShadow={false}
        frustumCulled={true}
        geometry={nodes.mesh_0.geometry}
        position={MESH_POSITION}
        receiveShadow={false} // 시야 밖 렌더링 방지
        ref={torus} // 그림자 비활성화
        rotation={[MESH_ROTATION_X, 0, 0]}
      >
        <MeshTransmissionMaterial
          {...materialProps}
          clearcoat={MATERIAL_CLEARCOAT} // 약간의 자체 발광 추가
          emissiveIntensity={MATERIAL_EMISSIVE_INTENSITY} // 광택 추가
        />
      </mesh>
    </group>
  );
}
