"use client";

import {
  Bodies,
  Engine,
  Mouse,
  MouseConstraint,
  Render,
  Runner,
  World,
} from "matter-js";
import { useEffect, useRef } from "react";

import { cn } from "@/shared/utils/tailwind";

const stackIcon = [
  "AWS.png",
  "Arch Linux.png",
  "Oh my zsh.png",
  "Cloudflare.png",
  "Podman.png",
  "Docker.png",
  "PostgresSQL.png",
  "Figma.png",
  "Python.png",
  "GIMP.png",
  "Raspberry Pi.png",
  "Git.png",
  "React.png",
  "GitHub Actions.png",
  "Redis.png",
  "GitHub.png",
  "Tailwind CSS.png",
  "Go.png",
  "Traefik Proxy.png",
  "HTML5.png",
  "TypeScript.png",
  "Homebrew.png",
  "Insomnia.png",
  "Vim.png",
  "Kubernetes.png",
  "Visual Studio Code (VS Code).png",
  "Linux.png",
  "Vite.js.png",
];

const GRAVITY_X = 0;
const GRAVITY_Y = 1;
const GRAVITY_SCALE = 0.001;
const CANVAS_BACKGROUND = "transparent";
const WALL_THICKNESS = 100;
const WALL_SAFE_ZONE = 100;
const ICON_DIAMETER = 30;
const ICON_TEXTURE_BASE_DIMENSION = 300;
const INITIAL_BODY_POSITION = 100;
const RANDOM_SORT_BIAS = 0.5;
const SLICE_START_INDEX = 0;
const MAX_RENDERED_ICONS = 10;
const MOUSE_CONSTRAINT_STIFFNESS = 0.05;
const CANVAS_FILTER = "grayscale(1)";

export function Playground({
  w,
  h,
  className,
}: {
  w: number;
  h: number;
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    const engine = Engine.create({
      gravity: { x: GRAVITY_X, y: GRAVITY_Y, scale: GRAVITY_SCALE },
    });

    const render = Render.create({
      engine,
      canvas,
      options: {
        width: w,
        height: h,
        background: CANVAS_BACKGROUND,
        wireframes: false,
      },
    });

    const wallProperties = {
      isStatic: true,
      render: {
        visible: false,
      },
    };
    const wallThickness = WALL_THICKNESS;
    const wallOffset = -(wallThickness / 2);
    const wallSafeZone = WALL_SAFE_ZONE;
    const wallPositions = [
      {
        x: w / 2,
        y: h - wallOffset,
        w: w + wallSafeZone,
        h: wallThickness,
      },
      {
        x: w / 2,
        y: wallOffset,
        w: w + wallSafeZone,
        h: wallThickness,
      },
      {
        x: wallOffset,
        y: h / 2,
        w: wallThickness,
        h: h + wallSafeZone,
      },
      {
        x: w - wallOffset,
        y: h / 2,
        w: wallThickness,
        h: h + wallSafeZone,
      },
    ];

    const walls = wallPositions.map((position) =>
      Bodies.rectangle(
        position.x,
        position.y,
        position.w,
        position.h,
        wallProperties
      )
    );

    const iconSize = ICON_DIAMETER;
    const iconScale = iconSize / ICON_TEXTURE_BASE_DIMENSION;
    const boxes = stackIcon.map((icon) =>
      Bodies.circle(INITIAL_BODY_POSITION, INITIAL_BODY_POSITION, iconSize, {
        render: {
          sprite: {
            texture: `/assets/images/stack-icon/${icon}`,
            xScale: iconScale,
            yScale: iconScale,
          },
        },
      })
    );

    const mouse = Mouse.create(render.canvas);
    const mouseConstraint = MouseConstraint.create(engine, {
      mouse,
      constraint: {
        stiffness: MOUSE_CONSTRAINT_STIFFNESS,
        render: {
          visible: false,
        },
      },
    });

    // 아이콘을 무작위로 선택하여 제한된 수만 렌더링합니다.
    World.add(engine.world, [
      ...walls,
      mouseConstraint,
      ...boxes
        .sort(() => Math.random() - RANDOM_SORT_BIAS)
        .slice(SLICE_START_INDEX, MAX_RENDERED_ICONS),
    ]);

    Render.run(render);
    const runner = Runner.create();
    Runner.run(runner, engine);

    return () => {
      Render.stop(render);
      Runner.stop(runner);
      Engine.clear(engine);
      // render.canvas = null;
      // render.context = null;
      render.textures = {};
    };
  }, [w, h]);

  return (
    <canvas
      aria-label="Interactive physics simulation with technology stack icons"
      className={cn(
        "rounded-lg border bg-card text-card-foreground shadow-xs",
        className
      )}
      height={h}
      ref={canvasRef}
      role="img"
      style={{
        filter: CANVAS_FILTER,
      }}
      width={w}
    />
  );
}
