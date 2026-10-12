export const THEMES = {
  dark: {
    bg: "#0d1117",
    border: "#30363d",
    tile: "#161b22",
    text: "#e6edf3",
    muted: "#8b949e",
    accent: "#58a6ff",
  },
  light: {
    bg: "#ffffff",
    border: "#d0d7de",
    tile: "#f6f8fa",
    text: "#1f2328",
    muted: "#656d76",
    accent: "#0969da",
  },
};

export const FONT_FAMILY = `-apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans", Helvetica, Arial, sans-serif`;

export const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" })[c]);
