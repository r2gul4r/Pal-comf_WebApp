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
        isolation: isolate;
        overflow: hidden;
        width: min(690px, calc(100vw - 56px));
        padding: 20px 24px 21px;
        border: 1px solid rgba(77, 238, 255, 0.92);
        border-left: 7px solid #45f4ff;
        border-radius: 12px;
        background:
          radial-gradient(
            circle at 8% 50%,
            rgba(39, 231, 255, 0.16),
            transparent 38%
          ),
          linear-gradient(
            110deg,
            rgba(3, 12, 25, 0.98),
            rgba(6, 23, 38, 0.97)
          );
        box-shadow:
          0 0 0 1px rgba(30, 210, 255, 0.2),
          0 0 30px rgba(31, 227, 255, 0.3),
          0 20px 64px rgba(0, 0, 0, 0.68);
        backdrop-filter: blur(14px) saturate(1.2);
        color: #eefcff;
        font-family: Arial, "Noto Sans KR", sans-serif;
        pointer-events: none;
        opacity: 0;
        filter: blur(2px);
        transform: translateY(20px) scale(0.975);
        transition:
          opacity 320ms ease,
          filter 320ms ease,
          transform 420ms cubic-bezier(0.16, 1, 0.3, 1);
      }
      #pal-comf-demo-caption::before {
        position: absolute;
        inset: 0;
        z-index: 0;
        background: linear-gradient(
          105deg,
          transparent 18%,
          rgba(99, 246, 255, 0.16) 48%,
          transparent 76%
        );
        content: "";
        opacity: 0;
        transform: translateX(-115%);
      }
      #pal-comf-demo-caption::after {
        position: absolute;
        top: 0;
        bottom: 0;
        left: 0;
        z-index: 0;
        width: 9px;
        background: linear-gradient(
          180deg,
          rgba(118, 255, 255, 0.35),
          #42f5ff 45%,
          rgba(34, 180, 255, 0.48)
        );
        box-shadow: 0 0 24px rgba(56, 241, 255, 0.95);
        content: "";
      }
      #pal-comf-demo-caption[data-visible="true"] {
        opacity: 1;
        filter: none;
        transform: translateY(0);
        animation: pal-comf-caption-glow 2.8s ease-in-out infinite;
      }
      #pal-comf-demo-caption[data-visible="true"]::before {
        animation: pal-comf-caption-sweep 3.2s ease-in-out infinite;
      }
      #pal-comf-demo-caption[data-placement="right"] {
        right: 28px;
        left: auto;
      }
      #pal-comf-demo-caption span {
        position: relative;
        z-index: 1;
        display: inline-flex;
        margin-bottom: 8px;
        padding: 4px 9px;
        border: 1px solid rgba(79, 235, 255, 0.42);
        border-radius: 4px;
        background: rgba(21, 194, 225, 0.12);
        box-shadow: inset 0 0 14px rgba(41, 222, 255, 0.08);
        color: #69f5ff;
        font-size: 12px;
        font-weight: 800;
        letter-spacing: 0.12em;
      }
      #pal-comf-demo-caption strong {
        position: relative;
        z-index: 1;
        display: block;
        color: #ffffff;
        font-size: 23px;
        line-height: 1.3;
        text-shadow:
          0 0 16px rgba(120, 246, 255, 0.26),
          0 2px 6px rgba(0, 0, 0, 0.72);
      }
      #pal-comf-demo-caption p {
        position: relative;
        z-index: 1;
        margin: 9px 0 0;
        color: #dcecf5;
        font-size: 15.5px;
        font-weight: 500;
        line-height: 1.55;
        text-shadow: 0 1px 4px rgba(0, 0, 0, 0.82);
      }
      @keyframes pal-comf-caption-sweep {
        0% {
          opacity: 0;
          transform: translateX(-115%);
        }
        18% {
          opacity: 1;
        }
        58%,
        100% {
          opacity: 0;
          transform: translateX(115%);
        }
      }
      @keyframes pal-comf-caption-glow {
        0%,
        100% {
          box-shadow:
            0 0 0 1px rgba(30, 210, 255, 0.2),
            0 0 24px rgba(31, 227, 255, 0.24),
            0 20px 64px rgba(0, 0, 0, 0.68);
        }
        50% {
          box-shadow:
            0 0 0 1px rgba(79, 238, 255, 0.32),
            0 0 38px rgba(31, 227, 255, 0.4),
            0 20px 64px rgba(0, 0, 0, 0.72);
        }
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
    title: "키워드 하나로 필요한 팰을 바로 찾도록 만들었습니다",
    body: "정식 버전에 새 패시브와 스킬이 추가됐지만, 인게임 검색이 없고 기존 DB도 팰을 하나씩 확인해야 했습니다.",
  }, 8500);

  await page.locator('button[title="목장 강화 효과 필터"]').click();
  const firstPalResult = page.locator(".results-grid .game-card").first();
  await firstPalResult.waitFor({ state: "visible" });
  await scrollIntoCenter(page, firstPalResult);
  await showCaption(page, {
    step: "01 · 거점 팰 찾기",
    title: "원하는 작업 효과를 가진 팰을 찾습니다",
    body: "목장 같은 작업 키워드를 선택하면 관련 팰과 스킬을 바로 확인할 수 있습니다.",
    placement: "right",
  }, 6500);

  await page.getByRole("button", { name: "필터 초기화" }).click();
  await page.getByLabel("스킬 종류").selectOption("passive");
  await page.getByLabel("팰 및 스킬 검색어 입력").fill("장인 기질");
  await scrollToResult(page, "장인 기질");
  await showCaption(page, {
    step: "02 · 패시브 정보",
    title: "검색한 패시브의 정보를 확인합니다",
    body: "패시브의 효과와 증가 수치를 한 화면에서 확인할 수 있습니다.",
    placement: "right",
  }, 6500);

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
    title: "불길한 알의 위치를 쉽게 확인하도록 만들었습니다",
    body: "친구들은 모두 찾았지만 저는 찾지 못해, 스폰 가능한 위치를 지도에 표시했습니다.",
  }, 7000);

  const pointFourButton = page
    .locator(".egg-map-point-list button")
    .filter({ hasText: "#04" });
  await pointFourButton.click();
  await page.getByText("선택 포인트 #04", { exact: true }).waitFor();
  await scrollIntoCenter(page, page.locator(".egg-map-selected"));
  await showCaption(page, {
    step: "04 · 좌표 확인",
    title: "알 아이콘을 선택하면 좌표를 확인할 수 있습니다",
    body: "선택한 지점의 X·Y·Z 좌표를 확인하고 게임 안에서 찾아갈 수 있습니다.",
  }, 6500);
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
