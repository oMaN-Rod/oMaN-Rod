import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

const login = process.env.GITHUB_USER ?? process.env.GITHUB_REPOSITORY_OWNER;
const token = process.env.GH_TOKEN ?? process.env.GITHUB_TOKEN;
const outDir = process.env.OUT_DIR ?? "profile";
const MAX_LANGS = 6;

if (!login || !token) {
  throw new Error("GITHUB_USER (or GITHUB_REPOSITORY_OWNER) and GH_TOKEN are required");
}

const THEMES = {
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

const ICONS = {
  star: "M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.751.751 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 6.374a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25Zm0 2.445L6.615 5.5a.75.75 0 0 1-.564.41l-3.097.45 2.24 2.184a.75.75 0 0 1 .216.664l-.528 3.084 2.769-1.456a.75.75 0 0 1 .698 0l2.77 1.456-.53-3.084a.75.75 0 0 1 .216-.664l2.24-2.183-3.096-.45a.75.75 0 0 1-.564-.41L8 2.694Z",
  commit: "M11.93 8.5a4.002 4.002 0 0 1-7.86 0H.75a.75.75 0 0 1 0-1.5h3.32a4.002 4.002 0 0 1 7.86 0h3.32a.75.75 0 0 1 0 1.5Zm-1.43-.75a2.5 2.5 0 1 0-5 0 2.5 2.5 0 0 0 5 0Z",
  pr: "M1.5 3.25a2.25 2.25 0 1 1 3 2.122v5.256a2.251 2.251 0 1 1-1.5 0V5.372A2.25 2.25 0 0 1 1.5 3.25Zm5.677-.177L9.573.677A.25.25 0 0 1 10 .854V2.5h1A2.5 2.5 0 0 1 13.5 5v5.628a2.251 2.251 0 1 1-1.5 0V5a1 1 0 0 0-1-1h-1v1.646a.25.25 0 0 1-.427.177L7.177 3.427a.25.25 0 0 1 0-.354ZM3.75 2.5a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Zm0 9.5a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Zm8.25.75a.75.75 0 1 0 1.5 0 .75.75 0 0 0-1.5 0Z",
  repo: "M2 2.5A2.5 2.5 0 0 1 4.5 0h8.75a.75.75 0 0 1 .75.75v12.5a.75.75 0 0 1-.75.75h-2.5a.75.75 0 0 1 0-1.5h1.75v-2h-8a1 1 0 0 0-.714 1.7.75.75 0 1 1-1.072 1.05A2.495 2.495 0 0 1 2 11.5Zm10.5-1h-8a1 1 0 0 0-1 1v6.708A2.486 2.486 0 0 1 4.5 9h8ZM5 12.25a.25.25 0 0 1 .25-.25h3.5a.25.25 0 0 1 .25.25v3.25a.25.25 0 0 1-.4.2l-1.45-1.087a.249.249 0 0 0-.3 0L5.4 15.7a.25.25 0 0 1-.4-.2Z",
  people: "M2 5.5a3.5 3.5 0 1 1 5.898 2.549 5.508 5.508 0 0 1 3.034 4.084.75.75 0 1 1-1.482.235 4 4 0 0 0-7.9 0 .75.75 0 0 1-1.482-.236A5.507 5.507 0 0 1 3.102 8.05 3.493 3.493 0 0 1 2 5.5ZM11 4a3.001 3.001 0 0 1 2.22 5.018 5.01 5.01 0 0 1 2.56 3.012.749.749 0 0 1-.885.954.752.752 0 0 1-.549-.514 3.507 3.507 0 0 0-2.522-2.372.75.75 0 0 1-.574-.73v-.352a.75.75 0 0 1 .416-.672A1.5 1.5 0 0 0 11 5.5.75.75 0 0 1 11 4Zm-5.5-.5a2 2 0 1 0-.001 3.999A2 2 0 0 0 5.5 3.5Z",
  flame: "M9.533.753V.752c.217 2.385 1.463 3.626 2.653 4.81C13.37 6.74 14.498 7.863 14.498 10c0 3.5-3 6-6.5 6S1.5 13.512 1.5 10c0-1.298.536-2.56 1.425-3.286.376-.308.862 0 1.035.454C4.46 8.487 5.581 8.419 6 8c.282-.282.341-.811-.003-1.5C4.34 3.187 7.035.75 8.77.146c.39-.137.726.194.763.607ZM7.998 14.5c2.832 0 5-1.98 5-4.5 0-1.463-.68-2.19-1.879-3.383l-.036-.037c-1.013-1.008-2.3-2.29-2.834-4.434-.322.256-.63.579-.864.953-.432.696-.621 1.58-.046 2.73.473.947.67 2.284-.278 3.232-.61.61-1.545.84-2.403.633a2.79 2.79 0 0 1-1.436-.874A3.198 3.198 0 0 0 3 10c0 2.53 2.164 4.5 4.998 4.5Z",
};

async function graphql(query, variables) {
  const res = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: {
      authorization: `bearer ${token}`,
      "content-type": "application/json",
      "user-agent": "profile-overview-card",
    },
    body: JSON.stringify({ query, variables }),
  });
  if (!res.ok) throw new Error(`GitHub API ${res.status}: ${await res.text()}`);
  const { data, errors } = await res.json();
  if (!data?.user) throw new Error(`GitHub API: ${JSON.stringify(errors)}`);
  for (const e of errors ?? []) {
    console.log(`::warning::${e.path?.join(".") ?? "query"}: ${e.message}`);
  }
  return data.user;
}

async function fetchProfile() {
  const now = new Date();
  const user = await graphql(
    `query ($login: String!) {
      user(login: $login) {
        name
        createdAt
        followers { totalCount }
        pullRequests { totalCount }
      }
    }`,
    { login },
  );

  const firstYear = new Date(user.createdAt).getUTCFullYear();
  const years = [];
  for (let y = firstYear; y <= now.getUTCFullYear(); y++) years.push(y);
  // contributionsCollection spans at most one year, so alias one per year.
  const yearly = await graphql(
    `query ($login: String!) {
      user(login: $login) {
        ${years
          .map(
            (y) => `y${y}: contributionsCollection(from: "${y}-01-01T00:00:00Z", to: "${
              y === now.getUTCFullYear() ? now.toISOString() : `${y}-12-31T23:59:59Z`
            }") {
              totalCommitContributions
              contributionCalendar { totalContributions }
            }`,
          )
          .join("\n")}
      }
    }`,
    { login },
  );
  const sumYears = (pick) => {
    const values = years.map((y) => pick(yearly[`y${y}`])).filter((v) => v != null);
    return values.length ? values.reduce((a, b) => a + b, 0) : null;
  };

  const repos = [];
  let cursor = null;
  do {
    const page = await graphql(
      `query ($login: String!, $cursor: String) {
        user(login: $login) {
          repositories(first: 100, after: $cursor, ownerAffiliations: OWNER, isFork: false, privacy: PUBLIC) {
            pageInfo { hasNextPage endCursor }
            nodes {
              stargazerCount
              languages(first: 20, orderBy: { field: SIZE, direction: DESC }) {
                edges { size node { name color } }
              }
            }
          }
        }
      }`,
      { login, cursor },
    );
    if (!page.repositories) throw new Error("GitHub API returned no repositories");
    repos.push(...page.repositories.nodes);
    cursor = page.repositories.pageInfo.hasNextPage ? page.repositories.pageInfo.endCursor : null;
  } while (cursor);

  const bytes = new Map();
  for (const repo of repos) {
    for (const { size, node } of repo.languages?.edges ?? []) {
      const lang = bytes.get(node.name) ?? { name: node.name, color: node.color, size: 0 };
      lang.size += size;
      bytes.set(node.name, lang);
    }
  }

  return {
    name: user.name ?? login,
    since: firstYear,
    languages: [...bytes.values()].sort((a, b) => b.size - a.size),
    stats: [
      { icon: "star", label: "Stars", value: repos.reduce((n, r) => n + r.stargazerCount, 0) },
      { icon: "commit", label: "Commits", value: sumYears((c) => c?.totalCommitContributions) },
      { icon: "pr", label: "Pull requests", value: user.pullRequests?.totalCount },
      { icon: "flame", label: "Contributions", value: sumYears((c) => c?.contributionCalendar?.totalContributions) },
      { icon: "repo", label: "Repositories", value: repos.length },
      { icon: "people", label: "Followers", value: user.followers?.totalCount },
    ].filter((s) => s.value != null),
  };
}

const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" })[c]);

const compact = new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 });
const formatCount = (n) => (n >= 10000 ? compact.format(n) : n.toLocaleString("en"));
const formatPercent = (p) => `${p.toFixed(1)}%`;

function languageSlices(languages, otherColor) {
  const total = languages.reduce((n, l) => n + l.size, 0);
  const slices = languages.slice(0, MAX_LANGS).map((l) => ({ ...l, color: l.color ?? otherColor }));
  const rest = languages.slice(MAX_LANGS).reduce((n, l) => n + l.size, 0);
  if (rest > 0) slices.push({ name: "Other", color: otherColor, size: rest });
  return slices.map((s) => ({ ...s, percent: (s.size / total) * 100 }));
}

function render(profile, theme) {
  const W = 840;
  const H = 232;
  const PAD = 28;
  const BODY_Y = 68;
  const TILE = { w: 120, h: 64, gap: 8, cols: 3 };
  const RIGHT_X = 448;
  const DONUT = { cx: RIGHT_X + 70, cy: BODY_Y + 70, r: 54, stroke: 18 };
  const circumference = 2 * Math.PI * DONUT.r;

  const tiles = profile.stats
    .map((s, i) => {
      const x = PAD + (i % TILE.cols) * (TILE.w + TILE.gap);
      const y = BODY_Y + Math.floor(i / TILE.cols) * (TILE.h + 12);
      return `
    <g class="fade" style="animation-delay:${150 + i * 80}ms" transform="translate(${x} ${y})">
      <rect width="${TILE.w}" height="${TILE.h}" rx="8" fill="${theme.tile}"/>
      <path transform="translate(12 11)" fill="${theme.accent}" d="${ICONS[s.icon]}"/>
      <text class="label" x="34" y="23.5">${esc(s.label)}</text>
      <text class="value" x="12" y="51">${formatCount(s.value)}</text>
    </g>`;
    })
    .join("");

  const slices = languageSlices(profile.languages, theme.muted);
  let offset = 0;
  const arcs = slices
    .map((s) => {
      const length = (s.percent / 100) * circumference;
      const visible = Math.max(length - 1.5, 0.5);
      const arc = `<circle cx="${DONUT.cx}" cy="${DONUT.cy}" r="${DONUT.r}" fill="none" stroke="${s.color}" stroke-width="${DONUT.stroke}" stroke-dasharray="${visible.toFixed(2)} ${(circumference - visible).toFixed(2)}" stroke-dashoffset="${(-offset).toFixed(2)}"/>`;
      offset += length;
      return arc;
    })
    .join("\n      ");

  const LEGEND_X = RIGHT_X + 168;
  const rowHeight = 140 / Math.max(slices.length, 1);
  const legend = slices
    .map((s, i) => {
      const y = BODY_Y + rowHeight * i + rowHeight / 2;
      return `
    <g class="fade" style="animation-delay:${300 + i * 80}ms" transform="translate(${LEGEND_X} ${y.toFixed(1)})">
      <circle cx="5" cy="0" r="5" fill="${s.color}"/>
      <text class="lang" x="18" y="4">${esc(s.name)}</text>
      <text class="percent" x="${W - PAD - LEGEND_X}" y="4" text-anchor="end">${formatPercent(s.percent)}</text>
    </g>`;
    })
    .join("");

  const title = `${profile.name}'s GitHub overview`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-labelledby="title">
  <title id="title">${esc(title)}</title>
  <style>
    text { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans", Helvetica, Arial, sans-serif; }
    .heading { font-size: 15px; font-weight: 600; fill: ${theme.text}; }
    .caption { font-size: 12px; fill: ${theme.muted}; }
    .label { font-size: 12px; fill: ${theme.muted}; }
    .value { font-size: 22px; font-weight: 600; fill: ${theme.text}; }
    .lang { font-size: 13px; fill: ${theme.text}; }
    .percent { font-size: 12px; fill: ${theme.muted}; font-variant-numeric: tabular-nums; }
    .count { font-size: 24px; font-weight: 600; fill: ${theme.text}; }
    .fade { animation: fade 0.5s ease-out both; }
    .sweep { animation: sweep 1.2s 0.2s cubic-bezier(0.65, 0, 0.35, 1) both; }
    @keyframes fade { from { opacity: 0; } }
    @keyframes sweep { from { stroke-dashoffset: ${circumference.toFixed(2)}; } }
    @media (prefers-reduced-motion: reduce) { .fade, .sweep { animation: none; } }
  </style>
  <rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" rx="10" fill="${theme.bg}" stroke="${theme.border}"/>

  <text class="heading" x="${PAD}" y="42">GitHub stats</text>
  <text class="caption" x="${W / 2 - PAD}" y="42" text-anchor="end">since ${profile.since}</text>
  ${tiles}

  <line x1="${W / 2}" y1="${PAD}" x2="${W / 2}" y2="${H - PAD}" stroke="${theme.border}"/>

  <text class="heading" x="${RIGHT_X}" y="42">Most used languages</text>
  <text class="caption" x="${W - PAD}" y="42" text-anchor="end">public repositories</text>
  <mask id="sweep">
    <circle class="sweep" cx="${DONUT.cx}" cy="${DONUT.cy}" r="${DONUT.r}" fill="none" stroke="#fff" stroke-width="${DONUT.stroke + 2}" stroke-dasharray="${circumference.toFixed(2)}" transform="rotate(-90 ${DONUT.cx} ${DONUT.cy})"/>
  </mask>
  <g mask="url(#sweep)">
    <g transform="rotate(-90 ${DONUT.cx} ${DONUT.cy})">
      ${arcs}
    </g>
  </g>
  <g class="fade" style="animation-delay:600ms" text-anchor="middle">
    <text class="count" x="${DONUT.cx}" y="${DONUT.cy + 4}">${profile.languages.length}</text>
    <text class="caption" x="${DONUT.cx}" y="${DONUT.cy + 21}">languages</text>
  </g>
  ${legend}
</svg>
`;
}

const profile = await fetchProfile();
if (!profile.languages.length) throw new Error("No language data returned");

for (const [name, theme] of Object.entries(THEMES)) {
  const path = `${outDir}/overview-${name}.svg`;
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, render(profile, theme));
  console.log(`wrote ${path}`);
}
