// 파트너 스킬 농축(1성~5성) 단계별 효과 상승 스트립 컴포넌트
import React from "react";
import type { EffectRecord } from "../../types/dataset";

interface RankProgressionProps {
  effect: EffectRecord;
}

export const RankProgression: React.FC<RankProgressionProps> = ({ effect }) => {
  if (!effect.rankValues || effect.rankValues.length === 0) {
    return null;
  }

  return (
    <div className="rank-progression">
      <span className="rank-title">농축 강화 단계별 효과</span>
      <div className="rank-grid">
        {effect.rankValues.map((rank) => {
          const valDisplay =
            effect.unit === "percent"
              ? `+${rank.value}%`
              : `+${rank.value}Lv`;

          return (
            <div key={rank.rankIndex} className="rank-cell">
              <span className="rank-star">{rank.rankIndex + 1}성</span>
              <strong className="rank-val">{valDisplay}</strong>
            </div>
          );
        })}
      </div>
    </div>
  );
};
