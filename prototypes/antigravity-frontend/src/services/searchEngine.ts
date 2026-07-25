// 팰월드 거점 강화 효과 역검색 및 알고리즘 모듈
import type {
  Dataset,
  PalRecord,
  SearchFilters,
  SearchHit,
  StackabilityFilter,
} from "../types/dataset";

// 기본 검색 필터 초기값
export const DEFAULT_FILTERS: SearchFilters = {
  query: "",
  workSuitabilityId: "all",
  kind: "all",
  metric: "all",
  scope: "all",
  stackability: "any",
};

// 한국어 정렬을 위한 Collator 객체
const koreanCollator = new Intl.Collator("ko");

// 검색어 텍스트 소문자 및 정규화 처리 (XSS 및 사기 입력 방지)
function sanitizeSearchText(text: string): string {
  return text.trim().toLocaleLowerCase("ko");
}

// 중첩 여부 조건 매칭 계산
function checkStackability(
  stackable: boolean | null,
  filter: StackabilityFilter
): boolean {
  if (filter === "any") return true;
  if (filter === "unknown") return stackable === null;
  return filter === "stackable" ? stackable === true : stackable === false;
}

// 히트 대상 통합 텍스트 추출 (팰 이름, 스킬명, 원문 설명, 대상 팰 등)
function extractSearchableText(hit: SearchHit): string {
  const fields = [
    hit.skill.nameKo,
    hit.skill.descriptionKo,
    hit.pal?.nameKo,
    hit.pal?.id,
    hit.effect.workSuitabilityNameKo,
    ...hit.effect.targetPalNamesKo,
    ...hit.effect.conditionPalNamesKo,
  ];
  return sanitizeSearchText(fields.filter(Boolean).join(" "));
}

// 전체 데이터셋으로부터 검색용 Hit 목록 일차 빌드 (스킬 X 효과 X 팰)
export function buildSearchHits(dataset: Dataset): SearchHit[] {
  const palsById = new Map<string, PalRecord>(
    dataset.pals.map((pal) => [pal.id, pal])
  );

  return dataset.skills.flatMap((skill) =>
    skill.effects.map((effect) => {
      const palId = skill.palIds[0];
      return {
        id: `${skill.id}::${effect.id}`,
        skill,
        effect,
        pal: palId ? palsById.get(palId) ?? null : null,
      };
    })
  );
}

// 사용자 필터 조건에 맞춰 팰월드 강화 효과 필터링 및 우선순위 정렬
export function filterSearchHits(
  hits: SearchHit[],
  filters: SearchFilters
): SearchHit[] {
  const query = sanitizeSearchText(filters.query);

  return hits
    .filter((hit) => filters.kind === "all" || hit.skill.kind === filters.kind)
    .filter(
      (hit) => filters.metric === "all" || hit.effect.metric === filters.metric
    )
    .filter(
      (hit) => filters.scope === "all" || hit.effect.scope === filters.scope
    )
    .filter((hit) => checkStackability(hit.effect.stackable, filters.stackability))
    .filter((hit) => {
      if (filters.workSuitabilityId === "all") return true;
      return hit.effect.applicableWorkSuitabilityIds.includes(
        filters.workSuitabilityId
      );
    })
    .filter((hit) => query.length === 0 || extractSearchableText(hit).includes(query))
    .sort((left, right) => {
      // 선택한 작업 적성 일치 항목 우선 정렬
      if (filters.workSuitabilityId !== "all") {
        const leftExact = left.effect.workSuitabilityId === filters.workSuitabilityId ? 1 : 0;
        const rightExact = right.effect.workSuitabilityId === filters.workSuitabilityId ? 1 : 0;
        if (leftExact !== rightExact) return rightExact - leftExact;
      }

      // 파트너 스킬을 특성보다 상단에 배치
      if (left.skill.kind !== right.skill.kind) {
        return left.skill.kind === "partner" ? -1 : 1;
      }

      // 가나다 순 한국어 이름 정렬
      return koreanCollator.compare(left.skill.nameKo, right.skill.nameKo);
    });
}
