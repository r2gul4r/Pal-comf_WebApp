// 고급 세부 필터 (스킬 종류, 강화 방식, 적용 범위, 중첩 여부) 툴바 컴포넌트
import React from "react";
import type { EffectMetric, EffectScope, SearchFilters, SkillKind, StackabilityFilter } from "../../types/dataset";

interface FilterToolbarProps {
  filters: SearchFilters;
  onFilterChange: <K extends keyof SearchFilters>(key: K, value: SearchFilters[K]) => void;
}

const SCOPE_LABELS: Record<EffectScope, string> = {
  self: "해당 팰 자신",
  other_base_pals: "거점의 다른 팰",
  all_base_pals: "거점 전체 적용",
  unknown: "범위 미확인",
};

export const FilterToolbar: React.FC<FilterToolbarProps> = ({
  filters,
  onFilterChange,
}) => {
  return (
    <div className="filter-toolbar">
      {/* 스킬 종류 필터 */}
      <div className="filter-group">
        <label htmlFor="filter-kind">스킬 종류</label>
        <select
          id="filter-kind"
          value={filters.kind}
          onChange={(e) => onFilterChange("kind", e.target.value as "all" | SkillKind)}
        >
          <option value="all">전체 (특성 + 파트너)</option>
          <option value="partner">파트너 스킬만</option>
          <option value="passive">특성(패시브)만</option>
        </select>
      </div>

      {/* 강화 방식 필터 */}
      <div className="filter-group">
        <label htmlFor="filter-metric">강화 방식</label>
        <select
          id="filter-metric"
          value={filters.metric}
          onChange={(e) => onFilterChange("metric", e.target.value as "all" | EffectMetric)}
        >
          <option value="all">전체 방식</option>
          <option value="work_speed">작업 속도 (%)</option>
          <option value="work_suitability_rank">작업 적성 레벨 (+Lv)</option>
        </select>
      </div>

      {/* 적용 범위 필터 */}
      <div className="filter-group">
        <label htmlFor="filter-scope">적용 범위</label>
        <select
          id="filter-scope"
          value={filters.scope}
          onChange={(e) => onFilterChange("scope", e.target.value as "all" | EffectScope)}
        >
          <option value="all">전체 범위</option>
          <option value="self">{SCOPE_LABELS.self}</option>
          <option value="other_base_pals">{SCOPE_LABELS.other_base_pals}</option>
          <option value="all_base_pals">{SCOPE_LABELS.all_base_pals}</option>
          <option value="unknown">{SCOPE_LABELS.unknown}</option>
        </select>
      </div>

      {/* 중첩 여부 필터 */}
      <div className="filter-group">
        <label htmlFor="filter-stackability">중첩 여부</label>
        <select
          id="filter-stackability"
          value={filters.stackability}
          onChange={(e) => onFilterChange("stackability", e.target.value as StackabilityFilter)}
        >
          <option value="any">전체 중첩 상태</option>
          <option value="stackable">중첩 가능</option>
          <option value="not_stackable">중첩 불가</option>
          <option value="unknown">중첩 미확인</option>
        </select>
      </div>
    </div>
  );
};
