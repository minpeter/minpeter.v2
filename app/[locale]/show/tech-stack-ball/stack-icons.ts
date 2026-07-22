export const STACK_ICONS = [
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

const MIN_ICON_SIZE = 24;
const MAX_ICON_SIZE = 36;
const ICON_WIDTH_RATIO = 0.07;
const ICON_TEXTURE_BASE_DIMENSION = 512;
const GITHUB_TEXTURE_WIDTH = 230;
const GITHUB_TEXTURE_HEIGHT = 225;
export const MAX_RENDERED_ICONS = 16;

export function shuffleArray<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function getIconSize(width: number) {
  return Math.max(
    MIN_ICON_SIZE,
    Math.min(MAX_ICON_SIZE, width * ICON_WIDTH_RATIO)
  );
}
export function getIconTextureScale(icon: string, iconSize: number) {
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
