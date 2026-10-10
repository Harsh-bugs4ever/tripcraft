import { spawn } from "node:child_process";
import { mkdtemp, rm, mkdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { chromium } from "playwright";
import { startProviderFixture } from "./provider-fixture.mjs";
const provider = await startProviderFixture({ initialDelayMs: 2500 });
const dir = await mkdtemp(path.join(tmpdir(), "tripcraft-browser-"));
const base = "http://127.0.0.1:3098";
const server = spawn("java", ["-jar", "backend/tripcraft-backend.jar"], {
  env: {
    ...process.env,
    PORT: "3098",
    DATA_DIR: dir,
    SERPAPI_API_KEY: "test-only-key",
    SERPAPI_BASE_URL: provider.url + "/search",
    WEATHER_BASE_URL: provider.url + "/weather",
    WEATHER_API_KEY: "",
    GROQ_API_KEY: "",
    GROQ_MODEL: "",
  },
  stdio: ["ignore", "pipe", "pipe"],
});
let log = "";
server.stdout.on("data", (d) => (log += d));
server.stderr.on("data", (d) => (log += d));
let browser;
let page;
try {
  let ready = false;
  for (let i = 0; i < 100; i++) {
    try {
      if ((await fetch(base + "/api/v1/health")).ok) {
        ready = true;
        break;
      }
    } catch {}
    await new Promise((r) => setTimeout(r, 100));
  }
  if (!ready) throw new Error("Server did not start " + log);
  browser = await chromium.launch({
    executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || undefined,
    args: process.env.PLAYWRIGHT_CHROMIUM_ARGS
      ? JSON.parse(process.env.PLAYWRIGHT_CHROMIUM_ARGS)
      : undefined,
    headless: true,
  });
  page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(base);
  await page.getByRole("button", {name:"Enter TripCraft"}).waitFor();
  await page.screenshot({path:"docs/screenshots/welcome-desktop.png",fullPage:true});
  await page.setViewportSize({width:390,height:844});
  await page.screenshot({path:"docs/screenshots/welcome-mobile.png",fullPage:true});
  if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)) throw new Error("Welcome overflow");
  await page.getByRole("button", {name:"Enter TripCraft"}).click();
  await page.setViewportSize({width:1440,height:1000});
  await page.getByRole("heading", { name: /Less planning/ }).waitFor();
  await page.screenshot({
    path: "docs/screenshots/home-desktop.png",
    fullPage: true,
  });
  const broken = await page
    .locator("img")
    .evaluateAll((imgs) =>
      imgs.filter((i) => !i.complete || i.naturalWidth === 0).map((i) => i.src),
    );
  if (broken.length) throw new Error("Broken images: " + broken.join(","));
  await page.getByRole("textbox", { name: "Leaving from", exact: true }).fill("Nashik, Maharashtra");
  await page.getByRole("textbox", { name: "Your next escape" }).fill("Udaipur, Rajasthan");
  await page.getByRole("button", { name: /Let’s make a plan/ }).click();
  if (await page.getByLabel("Leaving from", {exact:true}).inputValue() !== "Nashik, Maharashtra") throw new Error("Custom origin was not preserved");
  if (await page.getByLabel("Destination", {exact:true}).inputValue() !== "Udaipur, Rajasthan") throw new Error("Custom destination was not preserved");
  await page.getByLabel("Leaving from", {exact:true}).fill("Mumbai");
  await page.getByLabel("Destination", {exact:true}).fill("Alibaug");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByLabel("Make this a food-first trip").check();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page
    .getByRole("button", { name: "Craft my weekend", exact: true })
    .click();
  await page.getByRole("heading", { name: /Good weekends/ }).waitFor();
  await page.screenshot({
    path: "docs/screenshots/planning-desktop.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Pause travel animation" }).click();
  if (
    (await page
      .locator(".planning-art .flight-orbit")
      .evaluate((el) => getComputedStyle(el).animationPlayState)) !== "paused"
  )
    throw new Error("Animation pause failed");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({
    path: "docs/screenshots/planning-mobile.png",
    fullPage: true,
  });
  if (
    await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)
  )
    throw new Error("Loading page overflow");
  await page.emulateMedia({ reducedMotion: "reduce" });
  if (
    (await page
      .locator(".planning-art .flight-orbit")
      .evaluate((el) => getComputedStyle(el).animationName)) !== "none"
  )
    throw new Error("Reduced motion not respected");
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page
    .getByRole("heading", { name: /Mumbai → Alibaug Weekend/ })
    .waitFor({ timeout: 20000 });
  await page.screenshot({
    path: "docs/screenshots/itinerary-desktop.png",
    fullPage: true,
  });
  provider.setSevere(true);
  await page.getByRole("button", { name: "Refresh live conditions" }).click();
  await page.getByText("App screening: HIGH", { exact: false }).waitFor();
  await page.getByRole("button", { name: /Stay back/ }).click();
  await page
    .getByRole("heading", { name: "No Scheduled Stops Today" })
    .waitFor();
  provider.setSevere(false);
  const select = page.getByLabel("Version history");
  await select.selectOption({ index: 0 });
  await page.getByText("Scheduled Stops", { exact: false }).first().waitFor();
  page.on("dialog", (dialog) => dialog.accept());
  await page
    .getByRole("button", { name: "Find places for extra days" })
    .click();
  await page.getByRole("button", { name: /Day 3/ }).waitFor();
  await select.selectOption({ index: 0 });
  await page
    .getByRole("button", { name: /Day 3/ })
    .waitFor({ state: "detached" });
  const shiftedStart = new Date(Date.now() + 5 * 86400000)
    .toISOString()
    .slice(0, 10);
  await page.getByLabel("Reschedule start date").fill(shiftedStart);
  await page.getByRole("button", { name: "Reschedule my plan" }).click();
  await page.getByText(new RegExp("Trip moved to " + shiftedStart)).waitFor();
  await page.setViewportSize({ width: 390, height: 844 });
  if (
    await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth,
    )
  )
    throw new Error("Mobile itinerary overflow");
  await page.screenshot({
    path: "docs/screenshots/itinerary-mobile.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.getByRole("button", { name: "Export plan" }).click();
  await page.getByRole("dialog").waitFor();
  await page.pdf({
    path: "docs/screenshots/sample-plan.pdf",
    format: "A4",
    printBackground: true,
  });
  await page.getByRole("button", { name: "Close export" }).click();
  const tripUrl = page.url();
  const planResponse = await page.request.get(base + "/api/v1" + new URL(tripUrl).hash.slice(1));
  const planData = await planResponse.json();
  if (!planData.activeVersion.localGems.length) throw new Error("Dedicated local search produced no local picks");
  if (planData.activeVersion.localGems.some(g => g.confidence !== "LOW")) throw new Error("Uncorroborated fixture picks must be low confidence");
  if (!tripUrl.includes("#/trips/")) throw new Error("Missing trip route");
  await page.reload();
  await page
    .getByRole("heading", { name: /Mumbai → Alibaug Weekend/ })
    .waitFor();
  await page
    .getByRole("button", { name: /Saved trips/ })
    .first()
    .click();
  await page.getByText("Alibaug", { exact: false }).first().waitFor();
  if (!page.url().endsWith("#/saved")) throw new Error("Saved route missing");
  await page.goBack();
  await page
    .getByRole("heading", { name: /Mumbai → Alibaug Weekend/ })
    .waitFor();
  await page.goForward();
  await page.getByText("Alibaug", { exact: false }).first().waitFor();
  for (const [route, method, expected] of [
    ["/api/v1/not-a-route", "GET", 404],
    ["/api/v1/health", "PUT", 405],
  ]) {
    const response = await page.request.fetch(base + route, { method });
    if (response.status() !== expected)
      throw new Error(`${route}: ${response.status()} expected ${expected}`);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "TripCraft home" }).click();
  await page.screenshot({
    path: "docs/screenshots/home-mobile.png",
    fullPage: true,
  });
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth,
  );
  if (overflow) throw new Error("Mobile page overflows viewport");
  await page.getByRole("button", { name: "Open menu" }).click();
  await page
    .getByRole("button", { name: /Saved trips/ })
    .first()
    .click();
  if (errors.length) throw new Error(errors.join("\n"));
  console.log(
    "PASS Java backend + React: desktop/mobile rendering, image loading, trip creation, weather replan, extension, date restoration, postponement, mobile itinerary, export, saved reload, mobile menu; no browser exceptions.",
  );
} catch (error) {
  if (page) {
    console.error((await page.locator("body").innerText()).slice(-6000));
    await page.screenshot({
      path: "docs/screenshots/browser-failure.png",
      fullPage: true,
    });
  }
  throw error;
} finally {
  await browser?.close();
  server.kill();
  await new Promise((r) => server.on("exit", r));
  await rm(dir, { recursive: true, force: true });
  await provider.close();
}
