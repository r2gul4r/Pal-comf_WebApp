// 생성된 실제 팰월드 JSON 데이터셋 정적 인포트 모듈
import metaRaw from "../../../../data/generated/meta.json";
import palsRaw from "../../../../data/generated/pals.json";
import skillsRaw from "../../../../data/generated/skills.json";
import worldTreeEggMapRaw from "../../../../data/generated/world-tree-eggs.json";
import type { Dataset, DatasetMeta, PalRecord, SkillRecord } from "../types/dataset";
import type { WorldTreeEggMapDataset } from "../types/worldTreeEggMap";

// 팰월드 게임 1.0 검증된 정적 데이터셋 조합
export const loadedDataset: Dataset = {
  meta: metaRaw as DatasetMeta,
  pals: palsRaw.pals as PalRecord[],
  skills: skillsRaw.skills as SkillRecord[],
};

export const worldTreeEggMap =
  worldTreeEggMapRaw as WorldTreeEggMapDataset;

export function validateWorldTreeEggMap(
  dataset: WorldTreeEggMapDataset
): string[] {
  const errors: string[] = [];
  const indices = dataset.points?.map((point) => point.index) ?? [];

  if (indices.length !== 30 || new Set(indices).size !== 30) {
    errors.push("세계수 알 스폰 포인트 30개가 완전하지 않음");
  }

  if (!dataset.mapImage?.path || !dataset.markerIcon?.path) {
    errors.push("세계수 지도 또는 알 아이콘 자산 경로가 비어있음");
  }

  if (
    dataset.points?.some(
      (point) =>
        point.mapPosition.left < 0 ||
        point.mapPosition.left > 1 ||
        point.mapPosition.top < 0 ||
        point.mapPosition.top > 1
    )
  ) {
    errors.push("세계수 알 마커가 지도 범위를 벗어남");
  }

  return errors;
}

// 무결성 검증 유틸리티 (에러 발생 시 메시지 배열 반환)
export function validateLoadedDataset(dataset: Dataset): string[] {
  const errors: string[] = [];

  if (!dataset.meta || dataset.meta.validation?.status !== "passed") {
    errors.push("데이터셋 메타정보의 검증 상태가 올바르지 않음");
  }

  if (!Array.isArray(dataset.pals) || dataset.pals.length === 0) {
    errors.push("팰(Pal) 레코드 데이터가 비어있음");
  }

  if (!Array.isArray(dataset.skills) || dataset.skills.length === 0) {
    errors.push("스킬(Skill) 레코드 데이터가 비어있음");
  }

  return errors;
}
