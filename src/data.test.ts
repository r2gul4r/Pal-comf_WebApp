import { describe, expect, it } from "vitest";
import { gameDataset } from "./data";

describe("generated game UI metadata", () => {
  it("인게임 위젯이 매핑한 컬러 작업 적성 아이콘 13종을 생성함", () => {
    const icons = gameDataset.meta.workSuitabilities.filter(
      (work) => work.icon !== null,
    );

    expect(icons).toHaveLength(13);
    expect(
      icons.every((work) => work.icon?.width === work.icon?.height),
    ).toBe(true);
    expect(
      icons
        .filter((work) => work.id !== "OilExtraction")
        .every((work) => work.icon?.width === 64),
    ).toBe(true);
    expect(
      icons.every((work) =>
        work.icon?.sourceAssetPath.startsWith(
          "Pal/Content/Pal/Texture/UI/InGame/T_icon_palwork_",
        ),
      ),
    ).toBe(true);
    const oilIcon = gameDataset.meta.workSuitabilities.find(
      (work) => work.id === "OilExtraction",
    )?.icon;
    expect(oilIcon?.sourceAssetPath).toBe(
      "Pal/Content/Pal/Texture/UI/InGame/T_icon_palwork_09",
    );
    expect(oilIcon?.width).toBe(40);
  });

  it("패시브 네 계열을 인게임 위젯 Rank 분기와 연결함", () => {
    const examples = gameDataset.meta.uiAssets.passiveSkillExamples;
    expect(examples.map((example) => example.styleId)).toEqual([
      "common",
      "rare_yellow",
      "rare2_blue",
      "world_tree",
    ]);

    const passives = gameDataset.skills.filter(
      (skill) => skill.kind === "passive",
    );
    expect(passives).toHaveLength(9);
    expect(
      Object.fromEntries(
        passives.map((skill) => [
          skill.gameId,
          {
            evidenceKind: skill.passiveUi?.evidenceKind,
            rank: skill.rank,
            styleId: skill.passiveUi?.styleId,
          },
        ]),
      ),
    ).toEqual({
      CraftSpeed_up1: {
        evidenceKind: "widget_rank_dispatch",
        rank: 1,
        styleId: "common",
      },
      CraftSpeed_up2: {
        evidenceKind: "widget_rank_dispatch",
        rank: 3,
        styleId: "rare_yellow",
      },
      CraftSpeed_up3: {
        evidenceKind: "widget_rank_dispatch",
        rank: 4,
        styleId: "rare2_blue",
      },
      PAL_CorporateSlave: {
        evidenceKind: "widget_rank_dispatch",
        rank: 1,
        styleId: "common",
      },
      PAL_conceited: {
        evidenceKind: "widget_rank_dispatch",
        rank: 1,
        styleId: "common",
      },
      Rare: {
        evidenceKind: "widget_rank_dispatch",
        rank: 4,
        styleId: "rare2_blue",
      },
      WorkSuitabilityAddRank_MonsterFarm_1: {
        evidenceKind: "widget_rank_dispatch",
        rank: 3,
        styleId: "rare_yellow",
      },
      WorkSuitabilityAddRank_MonsterFarm_2: {
        evidenceKind: "widget_rank_dispatch",
        rank: 4,
        styleId: "rare2_blue",
      },
      WorldTree_CraftSpeed: {
        evidenceKind: "widget_rank_dispatch",
        rank: 5,
        styleId: "world_tree",
      },
    });
  });

  it("등급별 화살표 Texture2D 0~5를 전부 보존함", () => {
    const textures = gameDataset.meta.uiAssets.passiveSkillTextures;
    for (let rank = 0; rank <= 5; rank += 1) {
      expect(textures[`rankArrow${rank}`]?.sourceAssetPath).toBe(
        `Pal/Content/Pal/Texture/UI/Main_Menu/T_icon_skillstatus_rank_arrow_0${rank}`,
      );
    }
  });

  it("세계수 전용 머티리얼 4겹과 참조 텍스처를 설치본에서 보존함", () => {
    const { passiveSkillTextures, worldTreeEffect } =
      gameDataset.meta.uiAssets;

    expect(Object.keys(passiveSkillTextures)).toEqual(
      expect.arrayContaining([
        "worldTreeDissolve",
        "worldTreeDissolveTarget",
        "worldTreeScroll",
        "worldTreeScrollMask",
      ]),
    );
    expect(Object.keys(passiveSkillTextures)).not.toContain("worldTreeMask");
    expect(worldTreeEffect.widgetName).toBe("Overlay_CurseEff");
    expect(worldTreeEffect.opacity).toBe(1);
    expect(worldTreeEffect.layers.map((layer) => layer.id)).toEqual([
      "dissolve",
      "scroll_slow",
      "scroll_fast",
      "base_gradient",
    ]);

    const dissolve = worldTreeEffect.layers.find(
      (layer) => layer.id === "dissolve",
    );
    expect(dissolve).toBeDefined();
    if (!dissolve) {
      throw new Error("세계수 dissolve 레이어 누락");
    }
    expect(dissolve.materialAssetPath).toContain(
      "MI_UI_Dissolve_0_PalPassiveSkill",
    );
    expect(dissolve.brushTintAlpha).toBe(0.5);
    expect(dissolve.color.cssHex).toBe("#9C3FFFFF");
  });
});

describe("generated work applicability metadata", () => {
  const effects = gameDataset.skills.flatMap((skill) => skill.effects);
  const workSuitabilityIds = gameDataset.meta.workSuitabilities.map(
    (work) => work.id,
  );

  it("26개 효과 전부 유효한 적용 가능 작업을 명시함", () => {
    expect(gameDataset.meta.schemaVersion).toBe("1.5.0");
    expect(gameDataset.meta.counts.worldTreeEggPointCount).toBe(30);
    expect(effects).toHaveLength(26);

    const validIds = new Set(workSuitabilityIds);
    for (const effect of effects) {
      expect(effect.applicableWorkSuitabilityIds.length).toBeGreaterThan(0);
      expect(
        effect.applicableWorkSuitabilityIds.every((id) => validIds.has(id)),
      ).toBe(true);
      expect(new Set(effect.applicableWorkSuitabilityIds).size).toBe(
        effect.applicableWorkSuitabilityIds.length,
      );

      if (effect.workSuitabilityId !== null) {
        expect(effect.applicableWorkSuitabilityIds).toContain(
          effect.workSuitabilityId,
        );
      }
    }
  });

  it("세크메트의 아누비스 대상 효과는 아누비스 작업 3종에만 연결함", () => {
    const sekhmetSkill = gameDataset.skills.find(
      (skill) => skill.id === "partner:Sekhmet",
    );
    const anubisEffect = sekhmetSkill?.effects.find((effect) =>
      effect.targetPalIds.includes("Anubis"),
    );

    expect(anubisEffect).toBeDefined();
    expect(anubisEffect?.workApplicabilityEvidenceKind).toBe(
      "target_pal_work_suitabilities",
    );
    expect(anubisEffect?.applicableWorkSuitabilityIds).toEqual([
      "Handcraft",
      "Mining",
      "Transport",
    ]);
  });

  it("특정 작업이 없는 일반 작업 속도 특성 7개는 전 작업에 연결함", () => {
    const genericPassives = gameDataset.skills
      .filter((skill) => skill.kind === "passive")
      .flatMap((skill) => skill.effects)
      .filter(
        (effect) =>
          effect.metric === "work_speed" &&
          effect.workSuitabilityId === null,
      );

    expect(genericPassives).toHaveLength(7);
    for (const effect of genericPassives) {
      expect(effect.workApplicabilityEvidenceKind).toBe(
        "generic_all_work_speed",
      );
      expect(effect.applicableWorkSuitabilityIds).toEqual(workSuitabilityIds);
    }
  });
});
