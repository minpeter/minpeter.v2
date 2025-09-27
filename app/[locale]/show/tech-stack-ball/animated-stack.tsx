"use client";

import {
  World,
  Engine,
  Render,
  Bodies,
  Mouse,
  MouseConstraint,
  Runner,
} from "matter-js";
import React, { useEffect, useRef } from "react";

import { cn } from "@/lib/utils/tailwind";

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
    const engine = Engine.create({
      gravity: { x: 0, y: 1, scale: 0.001 },
    });

    const render = Render.create({
      engine,
      canvas: canvasRef.current!,
      options: {
        width: w,
        height: h,
        background: "transparent",
        wireframes: false,
      },
    });

    const wallProperties = {
      isStatic: true,
      render: {
        visible: false,
      },
    };
    const wallThickness = 100;
    const wallOffset = -(wallThickness / 2);
    const wallSafeZone = 100;
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

    const walls = wallPositions.map((position) => {
      return Bodies.rectangle(
        position.x,
        position.y,
        position.w,
        position.h,
        wallProperties
      );
    });

    const iconSize = 30;
    const iconScale = iconSize / 300;
    const boxs = stackIcon.map((icon) => {
      return Bodies.circle(100, 100, iconSize, {
        render: {
          sprite: {
            texture: `/assets/images/stack-icon/${icon}`,
            xScale: iconScale,
            yScale: iconScale,
          },
        },
      });
    });

    const mouse = Mouse.create(render.canvas);
    const mouseConstraint = MouseConstraint.create(engine, {
      mouse,
      constraint: {
        stiffness: 0.05,
        render: {
          visible: false,
        },
      },
    });

    // boxs에서 랜덤으로 반절만 선택
    World.add(engine.world, [
      ...walls,
      mouseConstraint,
      ...boxs.sort(() => Math.random() - 0.5).slice(0, 10),
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
      ref={canvasRef}
      width={w}
      height={h}
      className={cn(
        "bg-card text-card-foreground rounded-lg border shadow-xs",
        className
      )}
      style={{
        filter: "grayscale(1)",
      }}
    />
  );
}
