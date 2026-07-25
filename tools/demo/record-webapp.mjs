import { access, mkdir, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDirectory, "..", "..");
const outputDirectory = path.join(projectRoot, "output", "playwright");
const appUrl = process.argv[2] ?? "http://127.0.0.1:5174/";
const chromeCandidates = [
  process.env.PLAYWRIGHT_CHROME_PATH,
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
].filter(Boolean);

async function findBrowserExecutable() {
  for (const candidate of chromeCandidates) {
    try {
      await access(candidate);
      return candidate;
    } catch {
      // Try the next known browser path.
    }
  }

  throw new Error(
    "Chrome or Edge was not found. Set PLAYWRIGHT_CHROME_PATH.",
  );
}

async function showCaption(
  page,
  { step, title, body, placement = "left" },
  duration = 3600,
) {
  await page.evaluate(({ step, title, body, placement }) => {
    const overlay = document.querySelector("#pal-comf-demo-caption");

    if (!(overlay instanceof HTMLElement)) {
      throw new Error("Demo caption overlay is missing.");
    }

    overlay.innerHTML = `
      <span>${step}</span>
      <strong>${title}</strong>
      <p>${body}</p>
    `;
    overlay.dataset.placement = placement;
    overlay.dataset.visible = "true";
  }, { step, title, body, placement });
  await page.waitForTimeout(duration);
  await page.evaluate(() => {
    const overlay = document.querySelector("#pal-comf-demo-caption");
    if (overlay instanceof HTMLElement) {
      overlay.dataset.visible = "false";
    }
  });
  await page.waitForTimeout(450);
}

async function scrollIntoCenter(page, locator) {
  await locator.evaluate((element) => {
    element.scrollIntoView({
      behavior: "smooth",
      block: "center",
      inline: "nearest",
    });
  });
  await page.waitForTimeout(1200);
}

async function scrollToResult(page, text) {
  const target = page.getByText(text, { exact: true }).first();
  await target.waitFor({ state: "visible" });
  await scrollIntoCenter(page, target);
}

await mkdir(outputDirectory, { recursive: true });
const recordingDirectory = await mkdtemp(
  path.join(tmpdir(), "pal-comf-demo-"),
);

const browser = await chromium.launch({
  executablePath: await findBrowserExecutable(),
  headless: true,
});
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  recordVideo: {
    dir: recordingDirectory,
    size: { width: 1440, height: 900 },
  },
  colorScheme: "dark",
  locale: "ko-KR",
});
const page = await context.newPage();
const video = page.video();

try {
  await page.goto(appUrl, { waitUntil: "networkidle" });
  await page.getByRole("tablist", { name: "팰월드 데이터 도구" }).waitFor();
  await page.addStyleTag({
    content: `
      #pal-comf-demo-caption {
        position: fixed;
        left: 28px;
        bottom: 28px;
        z-index: 2147483647;
        width: min(660px, calc(100vw - 56px));
        padding: 18px 22px;
        border: 1px solid rgba(62, 240, 255, 0.72);
        border-left-width: 5px;
        border-radius: 10px;
        background: rgba(5, 13, 24, 0.94);
        box-shadow: 0 18px 50px rgba(0, 0, 0, 0.48);
        color: #eefcff;
        font-family: Arial, "Noto Sans KR", sans-serif;
        pointer-events: none;
        opacity: 0;
        transform: translateY(12px);
        transition: opacity 180ms ease, transform 180ms ease;
      }
      #pal-comf-demo-caption[data-visible="true"] {
        opacity: 1;
        transform: translateY(0);
      }
      #pal-comf-demo-caption[data-placement="right"] {
        right: 28px;
        left: auto;
      }
      #pal-comf-demo-caption span {
        display: block;
        margin-bottom: 5px;
        color: #39e9ff;
        font-size: 12px;
        font-weight: 800;
        letter-spacing: 0.12em;
      }
      #pal-comf-demo-caption strong {
        display: block;
        font-size: 22px;
        line-height: 1.3;
      }
      #pal-comf-demo-caption p {
        margin: 8px 0 0;
        color: #c6d6e2;
        font-size: 15px;
        line-height: 1.55;
      }
    `,
  });
  await page.evaluate(() => {
    const overlay = document.createElement("aside");
    overlay.id = "pal-comf-demo-caption";
    overlay.dataset.visible = "false";
    overlay.setAttribute("aria-hidden", "true");
    document.body.append(overlay);
  });
  await page.waitForTimeout(1300);
  await page.screenshot({
    path: path.join(outputDirectory, "pal-comf-cover.png"),
    fullPage: false,
  });

  await showCaption(page, {
    step: "PAL-COMF WEBAPP",
    title: "거점 팰을 일일이 찾기 귀찮아서 자동화함",
    body: "원하는 작업이나 패시브를 고르면 관련 팰과 효과를 바로 역검색함.",
  }, 3400);

  await page.locator('button[title="목장 강화 효과 필터"]').click();
  const firstPalResult = page.locator(".results-grid .game-card").first();
  await firstPalResult.waitFor({ state: "visible" });
  await scrollIntoCenter(page, firstPalResult);
  await showCaption(page, {
    step: "01 · 거점 팰 찾기",
    title: "목장 작업을 누르면 관련 팰만 모아봄",
    body: "목장 적성을 강화하는 팰과 파트너 스킬을 효과·수치와 함께 확인함.",
    placement: "right",
  }, 4300);

  await page.getByRole("button", { name: "필터 초기화" }).click();
  await page.getByLabel("스킬 종류").selectOption("passive");
  await page.getByLabel("팰 및 스킬 검색어 입력").fill("장인 기질");
  await scrollToResult(page, "장인 기질");
  await showCaption(page, {
    step: "02 · 패시브 찾기",
    title: "패시브 이름도 한 번에 검색함",
    body: "장인 기질의 전체 작업 속도 효과와 수치를 바로 확인함.",
    placement: "right",
  }, 4300);

  await page.getByRole("tab", { name: /불길한 알 스폰 지도/ }).click();
  const mapImage = page.getByAltText("팰월드 세계수 지역 인게임 지도");
  await mapImage.waitFor({ state: "visible" });
  await page.waitForFunction(() => {
    const image = document.querySelector(
      'img[alt="팰월드 세계수 지역 인게임 지도"]',
    );
    return image instanceof HTMLImageElement && image.complete;
  });
  const markerCount = await page.locator(".egg-map-marker").count();
  if (markerCount !== 30) {
    throw new Error(`Expected 30 egg markers, received ${markerCount}.`);
  }
  await scrollIntoCenter(page, page.locator(".egg-map-section__header"));
  await showCaption(page, {
    step: "03 · 불길한 알 지도",
    title: "친구들은 다 찾았는데 나만 못 찾아서 만듦",
    body: "불길한 알이 스폰될 수 있는 위치를 지도 위 알 아이콘으로 쉽게 확인함.",
  }, 4600);

  const pointFourButton = page
    .locator(".egg-map-point-list button")
    .filter({ hasText: "#04" });
  await pointFourButton.click();
  await page.getByText("선택 포인트 #04", { exact: true }).waitFor();
  await scrollIntoCenter(page, page.locator(".egg-map-selected"));
  await showCaption(page, {
    step: "04 · 좌표 확인",
    title: "알 아이콘을 누르면 인게임 좌표가 바로 나옴",
    body: "선택한 포인트의 X·Y·Z 좌표를 보고 게임 안에서 찾아가면 됨.",
  }, 4600);
} finally {
  await context.close();
  if (video) {
    await video.saveAs(
      path.join(outputDirectory, "pal-comf-demo.webm"),
    );
  }
  await browser.close();
  await rm(recordingDirectory, { recursive: true, force: true });
}

console.log(
  `Saved demo to ${path.join(outputDirectory, "pal-comf-demo.webm")}`,
);
