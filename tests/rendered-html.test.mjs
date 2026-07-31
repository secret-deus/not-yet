import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const templateRoot = new URL("../", import.meta.url);

async function worker() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  return (await import(workerUrl.href)).default;
}

function runtimeBindings() {
  return {
    ASSETS: {
      fetch: async () => new Response("Not found", { status: 404 }),
    },
  };
}

function executionContext() {
  return {
    waitUntil() {},
    passThroughOnException() {},
  };
}

test("server-renders the production application shell", async () => {
  const app = await worker();
  const response = await app.fetch(
    new Request("http://localhost/", {
      headers: { accept: "text/html" },
    }),
    runtimeBindings(),
    executionContext(),
  );

  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);
  const html = await response.text();
  assert.match(html, /<html lang="zh-CN">/i);
  assert.match(html, /<title>再等等 · 给购买决定一点时间<\/title>/i);
  assert.match(html, /再等等/);
  assert.match(html, /数据只存在本机/);
  assert.match(html, /正在读取你的记录/);
  assert.doesNotMatch(html, /codex-preview|react-loading-skeleton/i);
});

test("AI endpoint stays honestly disabled without server configuration", async () => {
  const app = await worker();
  const response = await app.fetch(
    new Request("http://localhost/api/reflect", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        contractVersion: "1",
        locale: "zh-CN",
        productName: "测试商品",
        currency: "CNY",
      }),
    }),
    runtimeBindings(),
    executionContext(),
  );

  assert.equal(response.status, 503);
  const payload = await response.json();
  assert.equal(payload.ok, false);
  assert.equal(payload.kind, "disabled");
  assert.match(payload.message, /本地检查清单/);
});

test("starter preview is removed and production metadata is present", async () => {
  const [page, layout, css, packageJson] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
  ]);

  await assert.rejects(access(new URL("../app/_sites-preview", import.meta.url)));
  assert.doesNotMatch(packageJson, /react-loading-skeleton/);
  assert.doesNotMatch(page, /SkeletonPreview|codex-preview/);
  assert.match(layout, /lang="zh-CN"/);
  assert.match(layout, /给购买决定一点时间/);
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
  assert.match(css, /--primary:\s*#205b4d/i);
  await assert.rejects(
    access(new URL("public/_sites-preview", templateRoot)),
  );
});
