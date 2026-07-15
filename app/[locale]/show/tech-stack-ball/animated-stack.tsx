"use client";
"use no memo";

import {
  Bodies,
  Body,
  Composite,
  Engine,
  Events,
  Mouse,
  MouseConstraint,
  Render,
  Runner,
} from "matter-js";
import { useTranslations } from "next-intl";
import { useEffect, useRef } from "react";

import { cn } from "@/shared/utils/tailwind";

const STACK_ICONS = [
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
const WALL_FRICTION = 0.2;
const WALL_RESTITUTION = 0.2;
const MIN_ICON_SIZE = 24;
const MAX_ICON_SIZE = 36;
const ICON_WIDTH_RATIO = 0.07;
const ICON_TEXTURE_BASE_DIMENSION = 512;
const GITHUB_TEXTURE_WIDTH = 230;
const GITHUB_TEXTURE_HEIGHT = 225;
const MAX_RENDERED_ICONS = 16;
const ICON_FRICTION = 0.08;
const ICON_FRICTION_AIR = 0.015;
const ICON_FRICTION_STATIC = 0.25;
const ICON_RESTITUTION = 0.35;
const MOUSE_CONSTRAINT_STIFFNESS = 0.2;
const MOUSE_CONSTRAINT_DAMPING = 0.1;
const MOUSE_CONSTRAINT_ANGULAR_STIFFNESS = 0.1;
const MAX_ICON_SPEED = 18;
const MAX_ICON_ANGULAR_SPEED = 0.35;
const MAX_PIXEL_RATIO = 2;
const POSITION_ITERATIONS = 8;
const VELOCITY_ITERATIONS = 6;
const CONSTRAINT_ITERATIONS = 4;
const CANVAS_FILTER = "grayscale(1)";

function shuffleArray<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function getIconSize(width: number) {
  return Math.max(
    MIN_ICON_SIZE,
    Math.min(MAX_ICON_SIZE, width * ICON_WIDTH_RATIO)
  );
}

function getIconTextureScale(icon: string, iconSize: number) {
  if (icon === "GitHub.png") {
    return {
      x: iconSize / GITHUB_TEXTURE_WIDTH,
      y: iconSize / GITHUB_TEXTURE_HEIGHT,
    };
  }

  return {
    x: iconSize / ICON_TEXTURE_BASE_DIMENSION,
    y: iconSize / ICON_TEXTURE_BASE_DIMENSION,
  };
}

function removeMouseListeners(canvas: HTMLCanvasElement, mouse: Mouse) {
  const handlers = mouse as Mouse & {
    mousedown: EventListener;
    mousemove: EventListener;
    mouseup: EventListener;
    mousewheel: EventListener;
  };

  canvas.removeEventListener("mousemove", handlers.mousemove);
  canvas.removeEventListener("mousedown", handlers.mousedown);
  canvas.removeEventListener("mouseup", handlers.mouseup);
  canvas.removeEventListener("wheel", handlers.mousewheel);
  canvas.removeEventListener("touchmove", handlers.mousemove);
  canvas.removeEventListener("touchstart", handlers.mousedown);
  canvas.removeEventListener("touchend", handlers.mouseup);
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
  const t = useTranslations("showcase.items.techStack");
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    const engine = Engine.create({
      constraintIterations: CONSTRAINT_ITERATIONS,
      enableSleeping: true,
      positionIterations: POSITION_ITERATIONS,
      velocityIterations: VELOCITY_ITERATIONS,
    });
    engine.gravity.x = GRAVITY_X;
    engine.gravity.y = GRAVITY_Y;
    engine.gravity.scale = GRAVITY_SCALE;

    const render = Render.create({
      canvas,
      engine,
      options: {
        background: CANVAS_BACKGROUND,
        height: h,
        pixelRatio: Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO),
        width: w,
        wireframes: false,
      },
    });

    const wallProperties = {
      friction: WALL_FRICTION,
      isStatic: true,
      render: {
        visible: false,
      },
      restitution: WALL_RESTITUTION,
    };
    const wallThickness = WALL_THICKNESS;
    const wallOffset = -(wallThickness / 2);
    const wallSafeZone = WALL_SAFE_ZONE;
    const wallPositions = [
      {
        h: wallThickness,
        w: w + wallSafeZone,
        x: w / 2,
        y: h - wallOffset,
      },
      {
        h: wallThickness,
        w: w + wallSafeZone,
        x: w / 2,
        y: wallOffset,
      },
      {
        h: h + wallSafeZone,
        w: wallThickness,
        x: wallOffset,
        y: h / 2,
      },
      {
        h: h + wallSafeZone,
        w: wallThickness,
        x: w - wallOffset,
        y: h / 2,
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

    const selectedIcons = shuffleArray(STACK_ICONS).slice(
      0,
      MAX_RENDERED_ICONS
    );
    const iconSize = getIconSize(w);
    const iconRadius = iconSize / 2;
    const columnCount = Math.ceil(Math.sqrt(selectedIcons.length * (w / h)));
    const rowCount = Math.ceil(selectedIcons.length / columnCount);
    const horizontalSpacing = w / (columnCount + 1);
    const verticalSpawnArea = Math.min(h * 0.5, rowCount * iconSize * 1.75);
    const verticalSpacing = verticalSpawnArea / (rowCount + 1);
    const icons = selectedIcons.map((icon, index) => {
      const column = index % columnCount;
      const row = Math.floor(index / columnCount);
      const textureScale = getIconTextureScale(icon, iconSize);

      return Bodies.circle(
        (column + 1) * horizontalSpacing,
        iconRadius + (row + 1) * verticalSpacing,
        iconRadius,
        {
          angle: ((index % 5) - 2) * 0.08,
          friction: ICON_FRICTION,
          frictionAir: ICON_FRICTION_AIR,
          frictionStatic: ICON_FRICTION_STATIC,
          label: icon,
          render: {
            sprite: {
              texture: `/assets/images/stack-icon/${icon}`,
              xScale: textureScale.x,
              yScale: textureScale.y,
            },
          },
          restitution: ICON_RESTITUTION,
        }
      );
    });

    const mouse = Mouse.create(render.canvas);
    // Matter.js parses the canvas data attribute with parseInt, which breaks
    // pointer coordinates on fractional device pixel ratios such as 1.25.
    mouse.pixelRatio = render.options.pixelRatio ?? 1;
    const mouseConstraint = MouseConstraint.create(engine, {
      constraint: {
        damping: MOUSE_CONSTRAINT_DAMPING,
        render: {
          visible: false,
        },
        stiffness: MOUSE_CONSTRAINT_STIFFNESS,
      },
      mouse,
    });
    const draggableConstraint =
      mouseConstraint.constraint as typeof mouseConstraint.constraint & {
        angularStiffness: number;
      };
    draggableConstraint.angularStiffness = MOUSE_CONSTRAINT_ANGULAR_STIFFNESS;
    const limitIconVelocity = () => {
      for (const icon of icons) {
        // Preserve direct manipulation and only cap the released body's throw.
        if (mouseConstraint.body === icon) {
          continue;
        }

        if (Body.getSpeed(icon) > MAX_ICON_SPEED) {
          Body.setSpeed(icon, MAX_ICON_SPEED);
        }

        if (Body.getAngularSpeed(icon) > MAX_ICON_ANGULAR_SPEED) {
          Body.setAngularSpeed(icon, MAX_ICON_ANGULAR_SPEED);
        }
      }
    };

    Events.on(engine, "beforeUpdate", limitIconVelocity);

    Composite.add(engine.world, [...walls, mouseConstraint, ...icons]);

    const runner = Runner.create();
    let isCanvasVisible = true;
    let isPageVisible = !document.hidden;
    let isRunning = false;

    const syncRunningState = () => {
      const shouldRun = isCanvasVisible && isPageVisible;

      if (shouldRun && !isRunning) {
        Render.run(render);
        Runner.run(runner, engine);
        isRunning = true;
      } else if (!shouldRun && isRunning) {
        Render.stop(render);
        Runner.stop(runner);
        isRunning = false;
      }
    };

    const intersectionObserver = new IntersectionObserver(
      ([entry]) => {
        isCanvasVisible = entry?.isIntersecting ?? false;
        syncRunningState();
      },
      { threshold: 0.01 }
    );
    const handleVisibilityChange = () => {
      isPageVisible = !document.hidden;
      syncRunningState();
    };

    intersectionObserver.observe(canvas);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    syncRunningState();

    return () => {
      intersectionObserver.disconnect();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      Render.stop(render);
      Runner.stop(runner);
      Events.off(engine, "beforeUpdate", limitIconVelocity);
      removeMouseListeners(canvas, mouse);
      Mouse.clearSourceEvents(mouse);
      Composite.clear(engine.world, false, true);
      Engine.clear(engine);
      render.textures = {};
    };
  }, [w, h]);

  return (
    <canvas
      aria-label={t("simulationLabel")}
      className={cn(
        "h-auto w-full max-w-full touch-none cursor-grab rounded-lg border bg-card text-card-foreground shadow-xs active:cursor-grabbing",
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
