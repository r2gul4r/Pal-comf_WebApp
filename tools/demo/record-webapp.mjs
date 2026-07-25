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
    step: "과제 A · 동작 화면",
    title: "팰월드 1.0 거점 강화 역검색기",
    body: "원하는 작업 효과를 먼저 고르면 관련 특성·파트너 스킬·팰을 현재 Steam 설치 데이터에서 역으로 찾음.",
  }, 4300);

  await page.locator('button[title="수작업 강화 효과 필터"]').click();
  await page.getByLabel("팰 및 스킬 검색어 입력").fill("핑토");
  await scrollToResult(page, "핑토");
  await showCaption(page, {
    step: "01 · 핵심 역검색",
    title: "수작업 + 핑토",
    body: "파트너 스킬이 다른 거점 팰의 수작업 적성을 +1 올리고 중첩되지 않는다는 구조화 결과와 1~5성 수치를 같이 표시함.",
    placement: "right",
  }, 4600);

  await page.getByRole("button", { name: "필터 초기화" }).click();
  await page.getByLabel("스킬 종류").selectOption("passive");
  await page.getByLabel("팰 및 스킬 검색어 입력").fill("장인 기질");
  await scrollToResult(page, "장인 기질");
  await showCaption(page, {
    step: "02 · 인게임 UI 매핑",
    title: "장인 기질 · 노란 Rank 3",
    body: "획득 풀을 색상으로 착각한 초기 구현을 폐기하고, 설치본 WBP의 Rank 분기와 실제 프레임·화살표 텍스처로 다시 매칭함.",
    placement: "right",
  }, 4000);

  await page.getByLabel("팰 및 스킬 검색어 입력").fill("초절기교");
  await scrollToResult(page, "초절기교");
  await showCaption(page, {
    step: "02 · 인게임 UI 매핑",
    title: "초절기교 · 파란 Rank 4",
    body: "장인 기질과 초절기교 색상 오류를 사용자 피드백으로 잡고 위젯 바이트코드와 등급별 화살표를 전수 검증함.",
    placement: "right",
  }, 4000);

  await page.getByLabel("팰 및 스킬 검색어 입력").fill("악마의 손");
  await scrollToResult(page, "악마의 손");
  await showCaption(page, {
    step: "02 · 인게임 UI 매핑",
    title: "악마의 손 · 세계수 Rank 5",
    body: "인게임 바탕 텍스처 위에 저농도 보라색 세계수 효과를 합성한 패시브 카드임.",
    placement: "right",
  }, 4000);

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
    step: "03 · 설치본 지도",
    title: "세계수 알 추첨 포인트 30곳",
    body: "T_TreeMap 이미지와 월드 파티션의 불길한 알 스포너 actor 좌표를 추출기가 결합함. 확정 출현이라고 과장하지 않음.",
  }, 4600);

  const pointFourButton = page
    .locator(".egg-map-point-list button")
    .filter({ hasText: "#04" });
  await pointFourButton.click();
  await page.getByText("선택 포인트 #04", { exact: true }).waitFor();
  await scrollIntoCenter(page, page.locator(".egg-map-selected"));
  await showCaption(page, {
    step: "04 · 좌표 오류 검증",
    title: "포인트 4 · (-1481, 1553)",
    body: "섬 실루엣 밖에 보이지만 pak 원본 actor도 같은 위치임. 보기 좋게 안쪽으로 조작하지 않고 Z 27,175와 원본 좌표를 보존함.",
  }, 3800);

  await page.locator(".egg-map-sources summary").click();
  await scrollIntoCenter(page, page.locator(".egg-map-sources"));
  await showCaption(page, {
    step: "04 · 게임 파일 근거",
    title: "선택 좌표 source package",
    body: "지도·알 아이콘 자산과 포인트 4 actor가 들어 있는 MainGrid 패키지를 화면에서 바로 확인할 수 있음.",
  }, 3400);

  const mapViewport = page.locator(".egg-map-viewport");
  await scrollIntoCenter(page, mapViewport);
  await mapViewport.hover({ position: { x: 520, y: 320 } });
  for (let index = 0; index < 16; index += 1) {
    await page.mouse.wheel(0, -600);
    await page.waitForTimeout(150);
  }
  await page.getByText("500%", { exact: true }).waitFor();
  await showCaption(page, {
    step: "05 · 지도 조작",
    title: "마우스 휠 500% 확대",
    body: "커서 아래 정규화 좌표를 줌 앵커로 유지해서 확대해도 30개 마커가 게임 좌표에서 밀리지 않음.",
  }, 4200);

  const viewportBox = await mapViewport.boundingBox();
  if (!viewportBox) {
    throw new Error("Map viewport bounding box is unavailable.");
  }
  const dragStart = {
    x: viewportBox.x + viewportBox.width * 0.58,
    y: viewportBox.y + viewportBox.height * 0.58,
  };
  await page.mouse.move(dragStart.x, dragStart.y);
  await page.mouse.down();
  await page.mouse.move(dragStart.x - 220, dragStart.y - 140, { steps: 18 });
  await page.mouse.up();
  await showCaption(page, {
    step: "05 · 지도 조작",
    title: "드래그 이동 + 좌표 고정",
    body: "Pointer capture로 지도를 잡아 이동하고, 선택 포인트와 500% 줌 상태는 탭을 왕복해도 유지함.",
  }, 3900);

  await page.getByRole("tab", { name: /거점 강화 역검색/ }).click();
  const searchInput = page.getByLabel("팰 및 스킬 검색어 입력");
  if ((await searchInput.inputValue()) !== "악마의 손") {
    throw new Error("Search state was not preserved across tabs.");
  }
  await scrollToResult(page, "악마의 손");
  await showCaption(page, {
    step: "검증 완료",
    title: "검색·지도 상태 보존",
    body: "lint, 타입 검사, Vitest 5파일 27개, 루트·최신 프론트 프로덕션 빌드를 통과한 상태로 녹화함.",
    placement: "right",
  }, 5200);
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
