// 팰 기본 작업 적성 리스트 바 컴포넌트
import React from "react";
import type { PalRecord } from "../../types/dataset";
import { WorkIcon } from "../common/WorkIcon";

interface WorkSuitabilitiesBarProps {
  pal: PalRecord;
}

export const WorkSuitabilitiesBar: React.FC<WorkSuitabilitiesBarProps> = ({ pal }) => {
  if (!pal.workSuitabilities || pal.workSuitabilities.length === 0) {
    return null;
  }

  return (
    <div className="work-suitabilities-bar">
      <span className="bar-label">보유 기본 작업 적성</span>
      <div className="suitability-chips">
        {pal.workSuitabilities.map((work) => (
          <span key={work.id} className="suitability-tag">
            <WorkIcon workId={work.id} size={24} />
            <span className="work-name">{work.nameKo}</span>
            <b className="work-level">Lv.{work.level}</b>
          </span>
        ))}
      </div>
    </div>
  );
};
