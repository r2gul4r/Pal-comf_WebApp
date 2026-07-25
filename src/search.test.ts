import { describe, expect, it } from "vitest";
import { buildSearchHits, filterSearchHits } from "./search";
import type { Dataset, EffectRecord, SkillRecord } from "./types";

const baseEffect: EffectRecord = {
  id: "effect:fixture",
  metric: "work_speed",
  workSuitabilityId: null,
  workSuitabilityNameKo: null,
  applicableWorkSuitabilityIds: [
    "Handcraft",
    "Seeding",
    "Mining",
    "Transport",
  ],
  workApplicabilityEvidenceKind: "generic_all_work_speed",
  value: 20,
  unit: "percent",
  scope: "self",
  targetPalIds: [],
  targetPalNamesKo: [],
  conditionPalIds: [],
  conditionPalNamesKo: [],
  stackable: null,
  rankValues: null,
  evidenceKind: "structured",
  raw: {
    targetType: "ToSelf",
    assignOthers: null,
    notAssignSelf: null,
    invokeWorker: true,
    invokeInBaseCamp: false,
    stackablePartnerSkillBySameTribe: null,
    workTypes: [],
    mapObjectIds: [],
  },
};

const skills: SkillRecord[] = [
  {
    id: "passive:fixture",
    gameId: "FixturePassive",
    kind: "passive",
    nameKo: "테스트 장인",
    descriptionKo: "작업 속도 +20%",
    rawDescriptionKo: null,
    palIds: [],
    effects: [baseEffect],
    rank: 1,
    availability: {
      kind: "standard_pal_trait_pool",
      lotteryWeight: 100,
      evidenceKind: "structured",
    },
    passiveUi: {
      family: "common",
      styleId: "common",
      evidenceKind: "widget_rank_dispatch",
    },
    sources: [],
  },
  {
    id: "partner:fixture-pal",
    gameId: "PARTNERSKILL_FixturePal",
    kind: "partner",
    nameKo: "테스트 수작업 응원",
    descriptionKo: "다른 거점 팰의 수작업 적성 레벨 +1",
    rawDescriptionKo: null,
    palIds: ["FixturePal"],
    effects: [
      {
        ...baseEffect,
        id: "effect:partner",
        metric: "work_suitability_rank",
        workSuitabilityId: "Handcraft",
        workSuitabilityNameKo: "수작업",
        applicableWorkSuitabilityIds: ["Handcraft"],
        workApplicabilityEvidenceKind: "explicit_work_suitability",
        value: 1,
        unit: "level",
        scope: "other_base_pals",
        stackable: false,
        rankValues: [
          { rankIndex: 0, value: 1 },
          { rankIndex: 1, value: 1 },
          { rankIndex: 2, value: 1 },
          { rankIndex: 3, value: 1 },
          { rankIndex: 4, value: 1 },
        ],
      },
      {
        ...baseEffect,
        id: "effect:targeted-pal",
        scope: "other_base_pals",
        targetPalIds: ["Anubis"],
        targetPalNamesKo: ["아누비스"],
        applicableWorkSuitabilityIds: ["Handcraft", "Mining", "Transport"],
        workApplicabilityEvidenceKind: "target_pal_work_suitabilities",
        stackable: false,
        rankValues: [
          { rankIndex: 0, value: 20 },
          { rankIndex: 1, value: 20 },
          { rankIndex: 2, value: 20 },
          { rankIndex: 3, value: 20 },
          { rankIndex: 4, value: 20 },
        ],
      },
    ],
    rank: null,
    availability: {
      kind: "specific_pal_partner_skill",
      lotteryWeight: null,
      evidenceKind: null,
    },
    passiveUi: null,
    sources: [],
  },
];

const fixtureDataset: Dataset = {
  meta: {
    schemaVersion: "fixture",
    steamAppId: "1623730",
    steamBuildId: "fixture",
    steamLanguage: "koreana",
    localization: "ko",
    gameRelease: "1.0",
    engineVersion: "5.1.1",
    extractedAtUtc: "2026-01-01T00:00:00Z",
    pakRelativePath: "fixture.pak",
    pakSize: 1,
    pakModifiedAtUtc: "2026-01-01T00:00:00Z",
    mappingFileName: "fixture.usmap",
    mappingSha256: "0".repeat(64),
    mountedArchiveCount: 1,
    sourceAssets: [],
    workSuitabilities: [
      { id: "Handcraft", nameKo: "수작업", icon: null },
      { id: "Seeding", nameKo: "파종", icon: null },
      { id: "Mining", nameKo: "채굴", icon: null },
      { id: "Transport", nameKo: "운반", icon: null },
    ],
    uiAssets: {
      passiveWidgetSourceAssetPath: "fixture-widget",
      passiveSkillTextures: {},
      passiveSkillStyles: [],
      worldTreeEffect: {
        widgetName: "Overlay_CurseEff",
        opacity: 0,
        layers: [],
        evidenceKind: "fixture",
      },
      passiveSkillExamples: [],
      sourceAssets: [],
    },
    counts: {
      palCount: 1,
      partnerSkillCount: 1,
      passiveSkillCount: 1,
      effectCount: 3,
      iconCount: 1,
      workSuitabilityIconCount: 0,
      passiveUiTextureCount: 0,
      worldTreeEggPointCount: 0,
    },
    validation: { status: "passed", errors: [] },
  },
  pals: [
    {
      id: "FixturePal",
      paldeckNo: 1,
      paldeckSuffix: "",
      nameKo: "테스트팰",
      nameEn: null,
      workSuitabilities: [{ id: "Handcraft", nameKo: "수작업", level: 1 }],
      iconPath: "/fixture.webp",
      iconWidth: 128,
      iconHeight: 128,
      iconSha256: "0".repeat(64),
      partnerSkillId: "partner:fixture-pal",
      sources: [],
    },
  ],
  skills,
};

describe("filterSearchHits", () => {
  const hits = buildSearchHits(fixtureDataset);

  it("작업 종류를 고르면 명시 효과, 대상 팰 효과와 전 작업 특성을 함께 찾음", () => {
    const result = filterSearchHits(hits, {
      query: "",
      workSuitabilityId: "Handcraft",
      kind: "all",
      metric: "all",
      scope: "all",
      stackability: "any",
    });

    expect(result.map((hit) => hit.effect.id)).toEqual([
      "effect:partner",
      "effect:targeted-pal",
      "effect:fixture",
    ]);
  });

  it("대상 팰이 못 하는 작업에서는 대상 한정 전체 작업 효과를 제외함", () => {
    const result = filterSearchHits(hits, {
      query: "",
      workSuitabilityId: "Seeding",
      kind: "all",
      metric: "all",
      scope: "all",
      stackability: "any",
    });

    expect(result.map((hit) => hit.effect.id)).toEqual(["effect:fixture"]);
  });

  it("대상 팰이 할 수 있는 작업에는 대상 한정 전체 작업 효과를 포함함", () => {
    const result = filterSearchHits(hits, {
      query: "",
      workSuitabilityId: "Mining",
      kind: "all",
      metric: "all",
      scope: "all",
      stackability: "any",
    });

    expect(result.map((hit) => hit.effect.id)).toEqual([
      "effect:targeted-pal",
      "effect:fixture",
    ]);
  });

  it("특성 종류와 중첩 미확인 상태를 같이 거름", () => {
    const result = filterSearchHits(hits, {
      query: "",
      workSuitabilityId: "all",
      kind: "passive",
      metric: "all",
      scope: "all",
      stackability: "unknown",
    });

    expect(result).toHaveLength(1);
    expect(result[0]?.skill.nameKo).toBe("테스트 장인");
  });

  it("팰 이름으로 파트너 효과를 찾음", () => {
    const result = filterSearchHits(hits, {
      query: "테스트팰",
      workSuitabilityId: "all",
      kind: "all",
      metric: "all",
      scope: "all",
      stackability: "any",
    });

    expect(result).toHaveLength(2);
    expect(result.every((hit) => hit.skill.kind === "partner")).toBe(true);
  });
});
