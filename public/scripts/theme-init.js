(() => {
  try {
    const storageKey = "theme";
    const defaultTheme = "light";
    const stored = localStorage.getItem(storageKey) || defaultTheme;
    const system = window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
    const resolved = stored === "system" ? system : stored;
    const root = document.documentElement;
    root.classList.remove("light", "dark");
    if (resolved === "light" || resolved === "dark") {
      root.classList.add(resolved);
      root.style.colorScheme = resolved;
    }
  } catch {
    // ignore (private mode / blocked storage)
  }
})();
