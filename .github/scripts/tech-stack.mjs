import { mkdir, writeFile } from "node:fs/promises";
import { THEMES, FONT_FAMILY, esc } from "./theme.mjs";

const outDir = process.env.OUT_DIR ?? "profile";
// Pinned: later simple-icons releases dropped the C# and PowerShell logos.
const ICON_CDN = "https://cdn.jsdelivr.net/npm/simple-icons@11.14.0/icons";

// First group circles on the outer ring, second on the inner ring.
const GROUPS = [
  {
    items: [
      { name: "TypeScript", slug: "typescript", color: "#3178C6" },
      { name: "JavaScript", slug: "javascript", color: "#F7DF1E", logo: "#000" },
      { name: "Rust", slug: "rust", color: "#000000" },
      { name: "Go", slug: "go", color: "#00ADD8" },
      { name: "C++", slug: "cplusplus", color: "#00599C" },
      { name: "C#", slug: "csharp", color: "#512BD4" },
      { name: "Python", slug: "python", color: "#3776AB" },
      { name: "PHP", slug: "php", color: "#777BB4" },
      { name: "Lua", slug: "lua", color: "#2C2D72" },
      { name: "Bash", slug: "gnubash", color: "#4EAA25" },
      { name: "PowerShell", slug: "powershell", color: "#5391FE" },
    ],
  },
  {
    items: [
      { name: "Svelte", slug: "svelte", color: "#FF3E00" },
      { name: "SvelteKit", slug: "svelte", color: "#FF3E00" },
      { name: "React", slug: "react", color: "#61DAFB", logo: "#000" },
      { name: ".NET", slug: "dotnet", color: "#512BD4" },
      { name: "Docker", slug: "docker", color: "#2496ED" },
      { name: "Kubernetes", slug: "kubernetes", color: "#326CE5" },
    ],
  },
];

const iconCache = new Map();
async function iconPath(slug) {
  if (!iconCache.has(slug)) {
    const res = await fetch(`${ICON_CDN}/${slug}.svg`);
    if (!res.ok) throw new Error(`icon ${slug}: HTTP ${res.status}`);
    const d = (await res.text()).match(/<path d="([-\d\s.,a-zA-Z]+)"/)?.[1];
    if (!d) throw new Error(`icon ${slug}: no path found`);
    iconCache.set(slug, d);
  }
  return iconCache.get(slug);
}

function ring(items, theme, { cx, cy, rx, ry, seconds, clockwise }) {
  const sweep = clockwise ? 1 : 0;
  const path = `M ${cx - rx},${cy} a ${rx},${ry} 0 1,${sweep} ${rx * 2},0 a ${rx},${ry} 0 1,${sweep} ${-rx * 2},0`;
  // Starting at the left, clockwise passes the back of the orbit first.
  const depth = clockwise ? "0.92;0.78;0.92;1.06;0.92" : "0.92;1.06;0.92;0.78;0.92";
  const chips = items
    .map((item, i) => {
      const timing = `dur="${seconds}s" begin="-${((i / items.length) * seconds).toFixed(2)}s" repeatCount="indefinite"`;
      return `
  <g>
    <animateMotion ${timing} path="${path}"/>
    <g>
      <animateTransform attributeName="transform" type="scale" ${timing} values="${depth}"/>
      <circle cy="-4" r="16" fill="${item.color}" stroke="${theme.border}"/>
      <path transform="translate(-9.5 -13.5) scale(${19 / 24})" fill="${item.logo ?? "#fff"}" d="${item.d}"/>
      <text class="name" y="27" text-anchor="middle">${esc(item.name)}</text>
    </g>
  </g>`;
    })
    .join("");
  return `
  <ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="none" stroke="${theme.border}" stroke-dasharray="2 6"/>${chips}`;
}

function render(groups, theme) {
  const W = 840;
  const H = 340;
  const cx = W / 2;
  const cy = H / 2 - 4;
  const [outer, inner] = groups;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-labelledby="title">
  <title id="title">Tech stack: ${esc(groups.flatMap((g) => g.items.map((i) => i.name)).join(", "))}</title>
  <style>
    text { font-family: ${FONT_FAMILY}; }
    .name { font-size: 11px; font-weight: 500; fill: ${theme.muted}; }
    .core { font-size: 17px; font-weight: 700; fill: ${theme.text}; }
    .pulse { transform-box: fill-box; transform-origin: center; animation: pulse 3s ease-in-out infinite; }
    @keyframes pulse { 50% { transform: scale(1.35); opacity: 0.05; } }
    @media (prefers-reduced-motion: reduce) { .pulse { animation: none; } }
  </style>
  <rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" rx="10" fill="${theme.bg}" stroke="${theme.border}"/>
  ${ring(outer.items, theme, { cx, cy, rx: 350, ry: 118, seconds: 60, clockwise: true })}
  ${ring(inner.items, theme, { cx, cy, rx: 190, ry: 56, seconds: 40, clockwise: false })}
  <circle class="pulse" cx="${cx}" cy="${cy}" r="30" fill="${theme.accent}" opacity="0.15"/>
  <circle cx="${cx}" cy="${cy}" r="20" fill="${theme.tile}" stroke="${theme.accent}" stroke-width="1.5"/>
  <text class="core" x="${cx}" y="${cy + 6}" text-anchor="middle">O</text>
</svg>
`;
}

const groups = await Promise.all(
  GROUPS.map(async (g) => ({
    ...g,
    items: await Promise.all(g.items.map(async (item) => ({ ...item, d: await iconPath(item.slug) }))),
  })),
);

await mkdir(outDir, { recursive: true });
for (const [name, theme] of Object.entries(THEMES)) {
  const path = `${outDir}/tech-stack-${name}.svg`;
  await writeFile(path, render(groups, theme));
  console.log(`wrote ${path}`);
}
