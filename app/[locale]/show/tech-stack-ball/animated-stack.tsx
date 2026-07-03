"use client";
"use no memo";

import {
  Bodies,
  Body,
  Engine,
  Events,
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
const GRAVITY_Y = 0;
const GRAVITY_SCALE = 0;
const CANVAS_BACKGROUND = "transparent";
const WALL_THICKNESS = 100;
const WALL_SAFE_ZONE = 100;
const ICON_DIAMETER = 30;
const ICON_TEXTURE_BASE_DIMENSION = 300;
const MAX_RENDERED_ICONS = 16;
const ICON_CENTER_PULL = 0.000_004;
const ICON_FRICTION_AIR = 0.025;
const ICON_INITIAL_SPEED = 1.35;
const MOUSE_CONSTRAINT_STIFFNESS = 0.05;
const CANVAS_FILTER = "grayscale(1)";

function shuffleArray<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

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

    const engine = Engine.create();
    engine.gravity.x = GRAVITY_X;
    engine.gravity.y = GRAVITY_Y;
    engine.gravity.scale = GRAVITY_SCALE;

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

    const center = { x: w / 2, y: h / 2 };
    const iconSize = ICON_DIAMETER;
    const iconScale = iconSize / ICON_TEXTURE_BASE_DIMENSION;
    const selectedIcons = shuffleArray(stackIcon).slice(0, MAX_RENDERED_ICONS);
    const boxes = selectedIcons.map((icon, index) => {
      const angle = (index / selectedIcons.length) * Math.PI * 2;
      const radiusByRing = [0.16, 0.27, 0.36][index % 3] ?? 0.27;
      const radius = Math.min(w, h) * radiusByRing;
      const body = Bodies.circle(
        center.x + Math.cos(angle) * radius,
        center.y + Math.sin(angle) * radius * 0.72,
        iconSize,
        {
          frictionAir: ICON_FRICTION_AIR,
          restitution: 0.9,
          render: {
            sprite: {
              texture: `/assets/images/stack-icon/${icon}`,
              xScale: iconScale,
              yScale: iconScale,
            },
          },
        }
      );

      Body.setVelocity(body, {
        x: -Math.sin(angle) * ICON_INITIAL_SPEED,
        y: Math.cos(angle) * ICON_INITIAL_SPEED,
      });
      Body.setAngularVelocity(body, index % 2 === 0 ? 0.025 : -0.025);

      return body;
    });

    const keepIconsCentered = () => {
      for (const body of boxes) {
        Body.applyForce(body, body.position, {
          x: (center.x - body.position.x) * body.mass * ICON_CENTER_PULL,
          y: (center.y - body.position.y) * body.mass * ICON_CENTER_PULL,
        });
      }
    };

    Events.on(engine, "beforeUpdate", keepIconsCentered);

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

    World.add(engine.world, [...walls, mouseConstraint, ...boxes]);

    Render.run(render);
    const runner = Runner.create();
    Runner.run(runner, engine);

    return () => {
      Events.off(engine, "beforeUpdate", keepIconsCentered);
      Render.stop(render);
      Runner.stop(runner);
      Engine.clear(engine);
      render.textures = {};
    };
  }, [w, h]);

  return (
    <canvas
      aria-label="Interactive physics simulation with technology stack icons"
      className={cn(
        "h-auto w-full max-w-full rounded-lg border bg-card text-card-foreground shadow-xs",
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
