# palAuto 개발 계획

## 1. 한 줄 목표

팰월드 1.0에서 원하는 **거점 작업 강화 효과**를 선택하면, 관련된 **팰 특성·파트너 스킬·팰**을 역으로 찾아주는 로컬 웹 도구를 만든다.

예시:

> "거점 전체 팰의 수작업 적성을 올리고 싶다"
> → 해당 효과를 가진 팰, 파트너 스킬 설명, 적용 대상, 증가량, 중첩 여부, 팰 자체 작업 적성을 보여준다.
## 1.1 현재 상태 — 2026-07-25

- 공개 GitHub 저장소 `r2gul4r/Pal-comf_WebApp`과 로컬 `main` 연결 완료
- 현재 Build ID `24181527`, UE `5.1.1`, pak 185,003 엔트리 확인
- `Mappings101.usmap`으로 `DT_PalMonsterParameter` 753행 직렬화 확인
- `sample` 명령으로 팰 5종 JSON·128×128 PNG 5장 생성 및 핑토 외부 교차검증 완료
- `generate` 명령으로 정상 도감 팰 16종, 파트너 스킬 16종, 특성 9종,
  효과 26개, WebP 16장을 생성하고 무결성 오류 0개 확인
- 게임 구조 필드와 한국어 원문이 충돌하는 중첩 값은 `unknown`으로 보존
- React 역검색 UI의 작업·종류·범위·중첩·텍스트 필터와 결과 카드 구현 완료
- 설치본 `WBP_IconPalWork.IconMap`에서 컬러 작업 적성 아이콘 13종과
  패시브 UI 텍스처 15종을 선택 추출하고
  WBP `SetPassiveSkill`의 Rank 분기, 랭크별 화살표와
  일반·노란·파란·세계수 애니메이션을 생성 메타에 결합
- 세계수 전용 Dissolve·Scroll 2겹·BaseGrd 머티리얼 구성을 확인하고,
  웹에서는 보라색 효과만 저농도로 표현
- Antigravity 결과 카드의 패시브 상단을 인게임 패시브 바로 교체하고,
  게임 원문을 효과 내용칸에 상시 표시하며 작업 아이콘은 컬러 Texture2D 사용
- 설치본 `DT_WorldMapUIData.Tree`의 `T_TreeMap`, 불길한 알 아이콘과
  세계수 알 스포너 30개를 선택 추출해 `world-tree-eggs.json`으로 생성
- 현재 5174 Antigravity 화면에 알 아이콘 마커, 인게임 좌표 목록,
  포인트 선택, 드래그 이동과 커서 기준 휠 100~500% 확대 기능을 결합하고
  모바일 가로 넘침 제거
- 거점 강화 역검색·패시브 결과와 불길한 알 지도를 상위 탭으로 분리하고,
  탭 왕복 뒤에도 검색 필터와 지도 줌·선택 포인트 상태를 유지
- 포인트 4의 지도 실루엣 외곽 배치는 UI 좌표 오류가 아니라 설치본 actor
  원본 위치임을 패키지·위젯 변환식·외부 지도 표본으로 교차검증해 수동 보정 안 함
- 작업 효과별 검색 가능 작업 ID를 구조화해 아누비스 대상 세크메트 효과가
  수작업·채굴·운반에만 노출되도록 수정하고 26개 효과 전수 검증 완료
- `pnpm lint`, `pnpm typecheck`, 실제 소스 테스트 27개, 루트·Antigravity 빌드 통과
- 1440×900·46.04초 WebM 자동 실행 영상을 최신 5174 화면에서 생성하고,
  자동화 배경·작업 효과 기반 팰 탐색·패시브 정보·불길한 알 좌표를 8개 프레임 검수 완료
- 과제 원문의 AI 기록·오답 교정·회고 조건을 README 제출 인덱스에 매핑하고
  2~3분 음성 설명용 대본과 실제 오류 기반 회고 작성
- 제출용 MVP 마감 완료. 다음 단계는 제출 피드백 대응이며 모드 구현은 별도 범위

## 2. 해결할 실제 문제

- 정식 출시 후 작업 적성 체계와 특성·파트너 스킬이 크게 바뀌었다.
- 원하는 효과는 알고 있어도 어떤 팰이 그 효과를 가졌는지 찾기 어렵다.
- 특성, 파트너 스킬, 팰 자체 작업 적성 정보가 서로 다른 화면과 문서에 흩어져 있다.
- 예전 버전 정보와 현재 1.0 정보가 검색 결과에서 섞인다.

## 3. MVP 범위

### 반드시 구현

1. 거점 작업 종류 필터
   - 불 피우기
   - 관개
   - 파종
   - 발전
   - 수작업
   - 채집
   - 벌목
   - 채광
   - 제약
   - 냉각
   - 운반
   - 목장
2. 스킬 종류 필터
   - 특성
   - 파트너 스킬
3. 적용 범위 필터
   - 해당 팰 자신
   - 거점의 다른 팰
   - 거점 전체
   - 알 수 없음
4. 검색 결과 카드
   - 팰 썸네일
   - 팰 이름
   - 스킬 이름과 원문 설명
   - 특성/파트너 스킬 구분
   - 작업 종류
   - 증가량
   - 적용 대상
   - 중첩 여부
   - 해당 팰의 기본 작업 적성
5. 데이터 기준 표시
   - Steam App ID
   - Steam Build ID
   - 추출 시각
   - 데이터가 나온 게임 파일 경로

### 이번 과제에서 제외

- 전체 팰 도감
- 전투·탑승·드롭 관련 스킬 전체
- 교배 계산기
- 세이브 파일 분석·수정
- 게임 모드 설치
- 게임 파일 수정
- 로그인, 서버, DB
- 외부 위키 실시간 크롤링
- 모바일 앱

범위를 넓히면 데이터 입력만 하다가 과제 망함. MVP는 거점 작업 강화 효과 검색 하나에 집중한다.

## 4. 데이터 원칙

### 기준 데이터

설치된 Steam 팰월드 게임 파일을 1차 기준으로 사용한다.

- 설치 경로: `C:\Program Files (x86)\Steam\steamapps\common\Palworld`
- pak 경로: `Pal\Content\Paks\Pal-Windows.pak`
- 현재 확인한 Steam Build ID: `24181527`
- 현재 Steam 언어 설정: `koreana`

### 안전 원칙

- 게임 설치 폴더는 읽기 전용으로 취급한다.
- pak이나 세이브 파일을 수정하지 않는다.
- 40GB pak 전체를 풀지 않고 필요한 파일만 선택해서 읽는다.
- 원본 uasset, uexp, locres, texture 파일은 저장소에 커밋하지 않는다.
- 추출 캐시와 팰 썸네일은 기본적으로 `.gitignore` 처리한다.
- 공개 배포 전에는 팰 이미지 재배포 범위를 다시 확인한다.
- 과제 제출용 로컬 실행과 화면 녹화를 먼저 목표로 한다.

## 5. 데이터 추출 전략

### 1단계: 자산 위치 조사

FModel 또는 CUE4Parse 계열 도구로 pak 인덱스를 읽고 아래 자산의 실제 1.0 경로를 확인한다.

- 팰 기본 데이터
- 팰 이름과 도감 번호
- 팰별 작업 적성
- 파트너 스킬 연결 정보
- 파트너 스킬 이름·설명
- 패시브 특성 이름·설명·효과
- 팰 ID와 썸네일 텍스처 연결 정보
- 한국어 현지화 리소스

이미 알려진 후보 경로는 검증 출발점으로만 사용한다.

- `Pal\Content\Pal\DataTable\Character\DT_PalMonsterParameter.uasset`
- `Pal\Content\Pal\DataTable\Character\DT_PalCharacterIconDataTable.uasset`

경로가 1.0에서 바뀌었으면 현재 pak 인덱스가 이긴다. 예전 문서를 억지로 맞추지 않는다.

### 2단계: 최소 샘플 추출

전체 데이터를 건드리기 전에 아래 샘플 하나를 성공시킨다.

- 팰 3~5종
- 팰 이름
- 작업 적성
- 파트너 스킬
- 거점 관련 특성
- 썸네일 PNG 또는 WebP

샘플이 성공해야 전체 추출기로 넘어간다.

### 3단계: 반복 가능한 추출기

최종적으로 `tools/extractor`에서 한 명령으로 아래 결과를 생성한다.

```text
게임 설치 경로 탐지
→ appmanifest에서 빌드 정보 읽기
→ pak에서 필요한 자산만 읽기
→ 한국어 현지화 결합
→ 효과를 정규화
→ 데이터 검증
→ 웹용 JSON·WebP 생성
```

예상 출력:

```text
data/generated/meta.json
data/generated/pals.json
data/generated/skills.json
data/generated/world-tree-eggs.json
public/generated/pals/*.webp
public/generated/ui/work-suitabilities/*.png
public/generated/ui/passive/*.png
public/generated/ui/maps/world-tree.webp
public/generated/ui/maps/ominous-egg.png
```

## 6. 기술 구성

### 웹

- Vite
- React
- TypeScript strict mode
- CSS는 가벼운 자체 스타일 또는 최소 UI 라이브러리
- Vitest
- 필요 시 Playwright로 핵심 검색 흐름 1개 검증

### 게임 데이터 추출

우선순위:

1. C# + CUE4Parse로 자동 추출기 작성
2. 최신 매핑 파일이 필요한 경우 프로젝트 외부 캐시에 둔다.
3. 초기 자산 조사에만 FModel을 사용한다.

현재 PC에는 .NET 8 런타임만 있고 SDK는 없다. C# 추출기를 만들기로 확정하면 .NET 8 SDK 설치 또는 프로젝트 로컬 SDK 구성이 필요하다.

### 실행 구조

- 웹앱은 생성된 정적 JSON만 읽는다.
- MVP에는 백엔드가 필요 없다.
- 데이터 추출과 웹 UI를 분리한다.
- UI 코드가 pak이나 게임 설치 경로를 직접 읽지 않는다.

## 7. 데이터 모델 초안

```ts
type SkillKind = "passive" | "partner";
type EffectScope = "self" | "other_base_pals" | "all_base_pals" | "unknown";
type EvidenceKind = "structured" | "localized_text" | "manual_verified";

interface PalRecord {
  id: string;
  paldeckNo: number | null;
  nameKo: string;
  nameEn: string | null;
  iconPath: string | null;
  workSuitabilities: Record<string, number>;
  partnerSkillId: string | null;
}

interface SkillRecord {
  id: string;
  kind: SkillKind;
  nameKo: string;
  descriptionKo: string;
  palIds: string[];
  workType: string | null;
  effectScope: EffectScope;
  suitabilityDelta: number | null;
  stackable: boolean | null;
  evidenceKind: EvidenceKind;
  sourceAsset: string;
}

interface DatasetMeta {
  steamAppId: "1623730";
  steamBuildId: string;
  generatedAt: string;
  pakSize: number;
  pakModifiedAt: string;
}
```

### 데이터 판단 규칙

- 게임 데이터에 구조화된 수치가 있으면 설명문 파싱보다 우선한다.
- 한국어 설명만으로 분류한 값은 `localized_text`로 표시한다.
- 중첩 여부가 확인되지 않으면 `false`로 지어내지 않고 `unknown`으로 둔다.
- 하나의 파트너 스킬에 여러 효과가 있으면 효과를 분리해서 저장한다.
- UI에는 추론값과 게임 원문 설명을 같이 보여준다.

## 8. 화면 초안

### 상단

- 서비스명
- "팰월드 1.0 거점 스킬 역검색기" 한 줄 설명
- 현재 데이터 Build ID

### 왼쪽 또는 상단 필터

- 작업 종류
- 특성/파트너 스킬
- 적용 대상
- 팰 이름·스킬명 텍스트 검색

### 결과 영역

- 일치 결과 개수
- 팰 썸네일 카드
- 핵심 효과를 먼저 표시
- 원문 설명 펼치기
- 팰 자체 작업 적성 표시
- 정보 불확실 시 경고 배지

### 빈 결과

- 필터를 초기화할 수 있는 버튼
- 데이터가 없는 것인지 검색 조건이 과한 것인지 구분

## 9. 테스트와 검증

### 데이터 검증

- 팰 ID 중복 없음
- 스킬 ID 중복 없음
- 모든 `palIds`가 실제 팰을 참조
- 한국어 이름과 설명이 비어 있지 않음
- 썸네일 경로가 있으면 파일도 존재
- 작업 적성 값이 허용 범위를 벗어나지 않음
- `unknown` 값을 몰래 0이나 false로 바꾸지 않음

### 검색 로직 테스트

- 빈 검색
- 작업 종류 하나 선택
- 특성만 선택
- 파트너 스킬만 선택
- 자기 자신과 거점 전체 효과 구분
- 중첩 가능/불가능/미확인 구분
- 썸네일 없는 팰 fallback
- 같은 스킬에 여러 효과가 있는 경우

### 완료 검증

```text
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

## 10. 구현 순서

### Phase 0 — 프로젝트 골격

- Git 저장소 초기화
- Vite + React + TypeScript 생성
- strict 설정
- 기본 lint/typecheck/test 명령 고정
- `.gitignore`에 게임 추출 캐시 추가

완료 조건: 빈 화면이 실행되고 검증 명령이 전부 통과한다.

### Phase 1 — 게임 데이터 탐색

- pak 인덱스 열기
- 최신 매핑 호환성 확인
- 필요한 DataTable·locres·아이콘 경로 기록
- 팰 3~5종 샘플 추출
- `docs/DATA_MAP.md` 작성

완료 조건: 한 팰의 한국어 이름·작업 적성·파트너 스킬·썸네일을 한 묶음으로 읽는다.

### Phase 2 — 정규화 파이프라인

- 데이터 스키마 구현
- 특성·파트너 스킬 분류
- 거점 작업 효과 태깅
- 한국어 현지화 결합
- JSON·WebP 생성
- 데이터 검증기 작성

완료 조건: 한 명령으로 같은 결과를 재생성하고 검증 오류가 0개다.

### Phase 3 — 검색 UI

- 필터 UI
- 검색 로직
- 결과 카드
- 썸네일 표시
- 원문 설명과 근거 상태 표시
- 빈 결과·오류 화면

완료 조건: "수작업 적성 증가" 같은 조건으로 관련 팰을 바로 찾는다.

### Phase 4 — QA와 과제 제출 자료

- 실제 게임 화면과 결과 대조
- 잘못 분류된 사례 수정
- 실행 화면 녹화 대본 작성
- AI 활용 기록 정리
- 회고 작성

완료 조건: 처음 보는 사람이 2~3분 영상만 보고 문제와 해결 결과를 이해한다.

## 11. AI 활용 기록 계획

개발과 동시에 `docs/AI_WORKLOG.md`에 중요한 상호작용을 남긴다.

각 기록은 아래 형식을 쓴다.

```text
목표
내가 AI에 준 요청
AI가 제안한 내용
내가 의심하거나 검증한 부분
실제 검증 방법과 결과
잘못된 부분
수정 요청
최종 결정
```

특히 아래는 숨기지 않고 기록한다.

- AI가 예전 버전 경로를 현재 경로라고 착각한 경우
- 특성과 파트너 스킬을 혼동한 경우
- 자기 적성 증가와 거점 전체 증가를 혼동한 경우
- 중첩 규칙을 근거 없이 단정한 경우
- 썸네일 매핑이 다른 팰을 가리킨 경우
- 한국어 현지화 키 결합에 실패한 경우

실패를 만들지는 않는다. 실제로 발생한 오류와 그 수정 과정만 남긴다.

## 12. 첫 작업

코드부터 찍지 않고 아래 순서로 시작한다.

1. pak 인덱스를 읽을 도구 결정
2. 현재 1.0 빌드와 매핑 호환성 확인
3. 실제 파트너 스킬·특성·아이콘 자산 경로 찾기
4. 팰 3~5종 샘플 추출
5. 샘플 데이터가 확인된 뒤 웹 프로젝트 골격 생성

첫 성공 기준은 화려한 화면이 아니다.

> 설치된 게임 파일에서 팰 한 종의 한국어 이름, 작업 적성, 파트너 스킬, 썸네일을 정확히 읽어 한 JSON으로 만드는 것.
