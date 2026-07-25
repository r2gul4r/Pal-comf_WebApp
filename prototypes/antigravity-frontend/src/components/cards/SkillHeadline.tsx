// 강화 효과 핵심 수치 및 스킬 헤드라인 표시 컴포넌트
import React from "react";
import type { EffectRecord, EffectScope, SkillRecord } from "../../types/dataset";
import { Badge } from "../common/Badge";
import { WorkIcon } from "../common/WorkIcon";

interface SkillHeadlineProps {
  effect: EffectRecord;
  skill: SkillRecord;
}

const SCOPE_LABELS: Record<EffectScope, string> = {
  self: "자신 전용",
  other_base_pals: "거점 다른 팰",
  all_base_pals: "거점 전체",
  unknown: "미확인",
};

export const SkillHeadline: React.FC<SkillHeadlineProps> = ({
  effect,
  skill,
}) => {
  const workName = effect.workSuitabilityNameKo ?? "전체 작업";
  const isSpeed = effect.metric === "work_speed";

  const headlineValue = isSpeed
    ? `${workName} 속도 +${effect.value}%`
    : `${workName} 적성 +${effect.value} Lv`;

  const stackableText =
    effect.stackable === true
      ? "중첩 가능"
      : effect.stackable === false
      ? "중첩 불가"
      : "중첩 미확인";

  return (
    <div className="skill-headline">
      <div className="skill-headline__badges">
        <Badge variant={skill.kind === "partner" ? "partner" : "passive"}>
          {skill.kind === "partner" ? "파트너 스킬" : "특성"}
        </Badge>
        <Badge variant="outline">{SCOPE_LABELS[effect.scope]}</Badge>
        <Badge variant={effect.stackable === true ? "accent" : "ghost"}>
          {stackableText}
        </Badge>
      </div>

      <div className="skill-headline__main">
        {effect.workSuitabilityId && (
          <WorkIcon
            workId={effect.workSuitabilityId}
            size={40}
            className="headline-icon"
          />
        )}
        <div className="headline-text">
          {skill.kind === "partner" && (
            <span className="skill-title">{skill.nameKo}</span>
          )}
          <strong className="effect-value">{headlineValue}</strong>
        </div>
      </div>

      <div className="skill-headline__description">
        <p>{skill.descriptionKo}</p>
      </div>
    </div>
  );
};
