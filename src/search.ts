import type {
  Dataset,
  EffectMetric,
  EffectRecord,
  EffectScope,
  PalRecord,
  SkillKind,
  SkillRecord,
} from "./types";

export type StackabilityFilter = "any" | "stackable" | "not_stackable" | "unknown";

export interface SearchFilters {
  query: string;
  workSuitabilityId: string;
  kind: "all" | SkillKind;
  metric: "all" | EffectMetric;
  scope: "all" | EffectScope;
  stackability: StackabilityFilter;
}

export interface SearchHit {
  id: string;
  skill: SkillRecord;
  effect: EffectRecord;
  pal: PalRecord | null;
}

export const DEFAULT_FILTERS: SearchFilters = {
  query: "",
  workSuitabilityId: "all",
  kind: "all",
  metric: "all",
  scope: "all",
  stackability: "any",
};

const koreanCollator = new Intl.Collator("ko");

function normalizeSearchText(value: string): string {
  return value.trim().toLocaleLowerCase("ko");
}

function matchesStackability(
  value: boolean | null,
  filter: StackabilityFilter,
): boolean {
  if (filter === "any") {
    return true;
  }

  if (filter === "unknown") {
    return value === null;
  }

  return filter === "stackable" ? value === true : value === false;
}

function searchableText(hit: SearchHit): string {
  return normalizeSearchText(
    [
      hit.skill.nameKo,
      hit.skill.descriptionKo,
      hit.pal?.nameKo,
      hit.pal?.id,
      hit.effect.workSuitabilityNameKo,
      ...hit.effect.targetPalNamesKo,
      ...hit.effect.conditionPalNamesKo,
    ]
      .filter(Boolean)
      .join(" "),
  );
}

export function buildSearchHits(dataset: Dataset): SearchHit[] {
  const palsById = new Map(dataset.pals.map((pal) => [pal.id, pal]));

  return dataset.skills.flatMap((skill) =>
    skill.effects.map((effect) => {
      const palId = skill.palIds[0];
      return {
        id: `${skill.id}::${effect.id}`,
        skill,
        effect,
        pal: palId ? (palsById.get(palId) ?? null) : null,
      };
    }),
  );
}

export function filterSearchHits(
  hits: SearchHit[],
  filters: SearchFilters,
): SearchHit[] {
  const query = normalizeSearchText(filters.query);

  return hits
    .filter((hit) => filters.kind === "all" || hit.skill.kind === filters.kind)
    .filter(
      (hit) =>
        filters.metric === "all" || hit.effect.metric === filters.metric,
    )
    .filter(
      (hit) => filters.scope === "all" || hit.effect.scope === filters.scope,
    )
    .filter((hit) => matchesStackability(hit.effect.stackable, filters.stackability))
    .filter((hit) => {
      if (filters.workSuitabilityId === "all") {
        return true;
      }

      return hit.effect.applicableWorkSuitabilityIds.includes(
        filters.workSuitabilityId,
      );
    })
    .filter((hit) => query.length === 0 || searchableText(hit).includes(query))
    .sort((left, right) => {
      if (filters.workSuitabilityId !== "all") {
        const leftExact =
          left.effect.workSuitabilityId === filters.workSuitabilityId ? 1 : 0;
        const rightExact =
          right.effect.workSuitabilityId === filters.workSuitabilityId ? 1 : 0;
        if (leftExact !== rightExact) {
          return rightExact - leftExact;
        }
      }

      if (left.skill.kind !== right.skill.kind) {
        return left.skill.kind === "partner" ? -1 : 1;
      }

      return koreanCollator.compare(left.skill.nameKo, right.skill.nameKo);
    });
}
