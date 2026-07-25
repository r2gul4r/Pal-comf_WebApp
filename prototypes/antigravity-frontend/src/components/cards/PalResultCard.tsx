// 팰월드 독창적 카드 재해석 컴포넌트 (PalResultCard)
import React from "react";
import type { SearchHit } from "../../types/dataset";
import { PassiveSkillPlate } from "../common/PassiveSkillPlate";
import { PalPortrait } from "./PalPortrait";
import { RankProgression } from "./RankProgression";
import { SkillHeadline } from "./SkillHeadline";
import { WorkSuitabilitiesBar } from "./WorkSuitabilitiesBar";

interface PalResultCardProps {
  hit: SearchHit;
}

export const PalResultCard: React.FC<PalResultCardProps> = ({ hit }) => {
  const { skill, effect, pal } = hit;
  let cardIdentity: React.ReactNode;

  if (skill.kind === "passive") {
    cardIdentity = (
      <div className="passive-card-identity">
        <PassiveSkillPlate
          nameKo={skill.nameKo}
          rank={skill.rank}
          size="large"
          styleId={skill.passiveUi?.styleId ?? null}
        />
      </div>
    );
  } else {
    if (!pal) {
      throw new Error(`파트너 스킬 팰 참조 누락: ${skill.id}`);
    }
    cardIdentity = <PalPortrait pal={pal} />;
  }

  return (
    <article className={`game-card game-card--${skill.kind}`}>
      {/* 파트너는 팰 정보, 특성은 인게임 패시브 플레이트 표시 */}
      {cardIdentity}

      {/* 스킬 명 및 버프 수치 헤드라인 */}
      <SkillHeadline
        effect={effect}
        skill={skill}
      />

      {/* 특수 조건 팰 명시 (있는 경우) */}
      {effect.targetPalNamesKo.length > 0 && (
        <div className="target-pals-note">
          <span>적용 대상 팰:</span>
          <strong>{effect.targetPalNamesKo.join(", ")}</strong>
        </div>
      )}
      {effect.conditionPalNamesKo.length > 0 && (
        <div className="target-pals-note">
          <span>발동 조건 팰:</span>
          <strong>{effect.conditionPalNamesKo.join(", ")}</strong>
        </div>
      )}

      {/* 농축 강화 단계 (1성~5성) 수치 표 */}
      <RankProgression effect={effect} />

      {/* 팰 기본 작업 적성 수치 */}
      {pal && <WorkSuitabilitiesBar pal={pal} />}
    </article>
  );
};
