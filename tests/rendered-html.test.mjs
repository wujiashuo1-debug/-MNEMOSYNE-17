import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", {
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
  assert.match(html, /非线性网页心理恐怖调查游戏/);
  assert.match(html, /SEARCHING FOR PREVIOUS WITNESS/);
  assert.match(html, /og:image/);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape/);
});

test("ships the nonlinear investigation systems and project artwork", async () => {
  const [page, css, layout] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
  ]);

  assert.match(page, /每日巡廊/);
  assert.match(page, /系统审计/);
  assert.match(page, /UNSCHEDULED INFERENCE/);
  assert.match(page, /generation=0/);
  assert.match(page, /REMOTE\/017/);
  assert.match(page, /corridorDays\.map/);
  assert.match(css, /\.corridor-app/);
  assert.match(css, /\.audit-app/);
  assert.match(css, /\.true-ending/);
  assert.match(layout, /MNEMOSYNE-17 \/ 没有第二天/);

  await Promise.all([
    access(new URL("../public/corridor-day1.webp", import.meta.url)),
    access(new URL("../public/corridor-day4.webp", import.meta.url)),
    access(new URL("../public/corridor-day7.webp", import.meta.url)),
    access(new URL("../public/cohort-1984.webp", import.meta.url)),
    access(new URL("../public/og.png", import.meta.url)),
  ]);

  await assert.rejects(access(new URL("../app/_sites-preview/", import.meta.url)));
});
