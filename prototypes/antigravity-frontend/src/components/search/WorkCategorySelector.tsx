// 거점 12가지 작업 적성 시각적 그리드 셀렉터 컴포넌트
import React from "react";
import type { WorkSuitabilityDefinition } from "../../types/dataset";
import { WorkIcon } from "../common/WorkIcon";

interface WorkCategorySelectorProps {
  workSuitabilities: WorkSuitabilityDefinition[];
  selectedId: string;
  onSelect: (id: string) => void;
}

export const WorkCategorySelector: React.FC<WorkCategorySelectorProps> = ({
  workSuitabilities,
  selectedId,
  onSelect,
}) => {
  return (
    <div className="work-selector" aria-label="작업 종류 필터 선택">
      <button
        type="button"
        className={`work-chip ${selectedId === "all" ? "work-chip--active" : ""}`}
        onClick={() => onSelect("all")}
      >
        <span className="work-chip__icon">✦</span>
        <span className="work-chip__label">전체 작업</span>
      </button>

      {workSuitabilities.map((work) => {
        const isActive = selectedId === work.id;
        return (
          <button
            key={work.id}
            type="button"
            className={`work-chip ${isActive ? "work-chip--active" : ""}`}
            onClick={() => onSelect(work.id)}
            title={`${work.nameKo} 강화 효과 필터`}
          >
            <WorkIcon workId={work.id} size={36} className="work-chip__icon" />
            <span className="work-chip__label">{work.nameKo}</span>
          </button>
        );
      })}
    </div>
  );
};
