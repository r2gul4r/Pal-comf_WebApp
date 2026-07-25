# 세계수 패시브 보라 효과 Design QA

## 비교 대상

- Source visual truth: 사용자가 대화에 첨부한 세계수 패시브 참고 이미지
- Implementation screenshot: Git에서 제외한 `.cache/design-qa/world-tree-final.png`
- Side-by-side evidence: Git에서 제외한 `.cache/design-qa/world-tree-comparison-final.png`
- 상태: 기본 필터, 세계수 샘플 `악마의 손`, 다크 테마
- 브라우저 viewport: 1265×720 CSS px, DPR 1
- 전체 브라우저 캡처: 1280×720 px
- Source: 528×78 px, 비교용 264×39 px로 축소
- Implementation component: 254.75×42 CSS px, 캡처 255×42 px,
  비교용 264×39 px로 정규화

## Full-view comparison evidence

전체 페이지에서 일반·노란·파란 패시브는 기존 상태를 유지했고 세계수 바에만
보라색 광과 작은 사각 입자가 추가됐다. 검색 패널과 결과 카드 레이아웃에는
변화가 없다.

## Focused region comparison evidence

컴포넌트가 255×42 px로 작아 세계수 바 자체를 확대 비교 대상으로 사용했다.
`world-tree-comparison-final.png`의 왼쪽이 레퍼런스, 오른쪽이 구현이다.
레퍼런스의 보라색 중앙 광과 사각 입자를 가져오되, 청록 프레임·배경·글자·
등급 화살표는 설치본 WBP에서 추출한 기존 세계수 디자인을 유지했다.

## Required fidelity surfaces

- Fonts and typography: 레퍼런스 글꼴을 복제하지 않고 설치본 WBP 기반 기존
  글자 크기·두께를 유지했다. 사용자의 최종 요청에 따른 의도적 차이다.
- Spacing and layout rhythm: 기존 42 px 패시브 바, inset, 이름과 화살표 위치를
  변경하지 않았다. 레퍼런스는 효과 밀도만 판단하는 데 사용했다.
- Colors and visual tokens: 레퍼런스 중앙색은 약 `#3F3C7D`, 구현은 약
  `#373463`이다. 앞선 요청의 저농도 표현을 보존한 허용 차이다.
- Image quality and asset fidelity: 프레임, 배경 마스크, 등급 화살표, 디졸브와
  스크롤 입자는 설치본에서 선택 추출한 PNG를 사용한다. 깨진 이미지가 없다.
- Copy and content: 레퍼런스의 `차원 도약`을 복제하지 않고 현재 게임 데이터의
  실제 샘플명 `악마의 손`을 유지했다.

## Comparison history

1. 첫 캡처 `world-tree-before.png`
   - P2: 보라색 효과가 거의 보이지 않아 레퍼런스의 계열 구분이 사라졌다.
   - 수정: 세계수 전용 오버레이와 기존 보라 그라데이션 노출을 올렸다.
2. 두 번째 캡처 `world-tree-after-1.png`
   - P2: 중앙 보라색이 여전히 어둡고 레퍼런스의 사각 입자 대비가 약했다.
   - 수정: 오버레이를 55%, 보라 그라데이션을 60%로 조정했다.
3. 최종 캡처 `world-tree-final.png`
   - 사용자의 최종 지시에 따라 레퍼런스식 프레임·글자 변경은 제거하고,
     설치본 세계수 바탕 위에 보라 효과만 남겼다.

## Interaction and runtime checks

- 수작업 필터 선택: 26개에서 11개로 변경
- 전체 작업 재선택: 26개로 복원
- 브라우저 warning/error: 0개
- `pnpm lint`, `pnpm typecheck`, 테스트 8개, 루트 build,
  Antigravity 프론트 build 통과

## Findings

- P0/P1/P2 없음.
- P3: 레퍼런스의 세로로 피어오르는 불꽃 질감은 Unreal 동적 머티리얼을
  실행하지 않는 웹 한계 때문에 더 평평하다. 사용자가 100% 복제를 원하지
  않고 저농도 보라 효과만 요청했으므로 후속 차단 항목이 아니다.

## Implementation Checklist

- [x] 설치본 세계수 프레임·배경·글자·등급 화살표 유지
- [x] 보라색 디졸브·그라데이션·사각 입자만 오버레이
- [x] 다른 패시브 스타일과 검색 동작 회귀 없음
- [x] 브라우저 비교 및 빌드 검증 완료

## Follow-up Polish

- 사용자가 더 강한 효과를 원할 때 오버레이 계수만 미세 조정한다.

final result: passed
