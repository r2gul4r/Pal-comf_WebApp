import metaJson from "../data/generated/meta.json";
import palsJson from "../data/generated/pals.json";
import skillsJson from "../data/generated/skills.json";
import type { Dataset, DatasetMeta, PalRecord, SkillRecord } from "./types";

const dataset: Dataset = {
  meta: metaJson as DatasetMeta,
  pals: palsJson.pals as PalRecord[],
  skills: skillsJson.skills as SkillRecord[],
};

export function validateDataset(value: Dataset): string[] {
  const errors: string[] = [];
  const palIds = new Set(value.pals.map((pal) => pal.id));
  const skillIds = new Set(value.skills.map((skill) => skill.id));
  const workSuitabilityIds = new Set(
    value.meta.workSuitabilities.map((work) => work.id),
  );

  if (palIds.size !== value.pals.length) {
    errors.push("팰 ID가 중복됨");
  }

  if (skillIds.size !== value.skills.length) {
    errors.push("스킬 ID가 중복됨");
  }

  for (const pal of value.pals) {
    if (!skillIds.has(pal.partnerSkillId)) {
      errors.push(`${pal.id}의 파트너 스킬 참조가 끊김`);
    }
  }

  for (const skill of value.skills) {
    for (const palId of skill.palIds) {
      if (!palIds.has(palId)) {
        errors.push(`${skill.id}가 없는 팰 ${palId}을 참조함`);
      }
    }

    if (skill.effects.length === 0) {
      errors.push(`${skill.id}에 정규화 효과가 없음`);
    }

    for (const effect of skill.effects) {
      if (
        !Array.isArray(effect.applicableWorkSuitabilityIds) ||
        effect.applicableWorkSuitabilityIds.length === 0
      ) {
        errors.push(`${effect.id}에 적용 가능한 작업 종류가 없음`);
        continue;
      }

      for (const workSuitabilityId of effect.applicableWorkSuitabilityIds) {
        if (!workSuitabilityIds.has(workSuitabilityId)) {
          errors.push(
            `${effect.id}가 알 수 없는 작업 ${workSuitabilityId}을 참조함`,
          );
        }
      }

      if (
        effect.workSuitabilityId !== null &&
        !effect.applicableWorkSuitabilityIds.includes(effect.workSuitabilityId)
      ) {
        errors.push(`${effect.id}의 명시 작업과 적용 가능 작업이 충돌함`);
      }
    }
  }

  if (value.meta.validation.status !== "passed") {
    errors.push(...value.meta.validation.errors);
  }

  return errors;
}

export const gameDataset = dataset;
