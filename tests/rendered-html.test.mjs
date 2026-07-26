import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

async function render(path = "/") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request(`http://localhost${path}`, {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("server-renders the game boot shell and production metadata", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<html lang="zh-CN">/i);
  assert.match(html, /<title>MNEMOSYNE-17 \/ 没有第二天<\/title>/i);
  assert.match(html, /B2 事故封存资料数字化入口/);
  assert.match(html, /SEARCHING FOR PREVIOUS WITNESS/);
  assert.match(html, /og:image/);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape/);
});

test("server-renders the complete investigator manual", async () => {
  const response = await render("/guide");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /调查员.*全流程手册/s);
  assert.match(html, /最短完整通关路线/);
  assert.match(html, /generation=0/);
  assert.match(html, /REMOTE\/017/);
  assert.match(html, /七日巡廊标注表/);
});

test("ships the nonlinear investigation systems and project artwork", async () => {
  const [page, guide, css, layout] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/guide/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
  ]);

  assert.match(page, /每日巡廊/);
  assert.match(page, /系统审计/);
  assert.match(page, /UNSCHEDULED INFERENCE/);
  assert.match(page, /generation=0/);
  assert.match(page, /REMOTE\/017/);
  assert.match(page, /corridorDays\.map/);
  assert.match(page, /B2 事故资料接收说明/);
  assert.match(page, /rolePreludes/);
  assert.match(page, /orientation-film\.mp4/);
  assert.match(page, /corridorPin/);
  assert.match(page, /record-reader/);
  assert.match(page, /请求检索建议/);
  assert.match(page, /操作手册/);
  assert.match(guide, /11 条表层证据完整位置/);
  assert.match(guide, /第二次反证与真结局/);
  assert.match(css, /\.corridor-app/);
  assert.match(css, /\.audit-app/);
  assert.match(css, /\.true-ending/);
  assert.match(css, /\.prologue-screen/);
  assert.match(css, /\.role-prelude-layout/);
  assert.match(css, /\.guide-panel/);
  assert.match(css, /\.desk-intro/);
  assert.match(css, /\.manual-shell/);
  assert.match(layout, /MNEMOSYNE-17 \/ 没有第二天/);

  await Promise.all([
    access(new URL("../public/corridor-day1.webp", import.meta.url)),
    access(new URL("../public/corridor-day4.webp", import.meta.url)),
    access(new URL("../public/corridor-day7.webp", import.meta.url)),
    access(new URL("../public/cohort-1984.webp", import.meta.url)),
    access(new URL("../public/orientation-film.mp4", import.meta.url)),
    access(new URL("../public/orientation-film.vtt", import.meta.url)),
    access(new URL("../public/orientation-institute-1998.png", import.meta.url)),
    access(new URL("../public/orientation-lab-2001.png", import.meta.url)),
    access(new URL("../public/og.png", import.meta.url)),
  ]);

  await assert.rejects(access(new URL("../app/_sites-preview/", import.meta.url)));
});
