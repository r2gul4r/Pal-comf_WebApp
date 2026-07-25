export type SkillKind = "passive" | "partner";
export type EffectMetric = "work_speed" | "work_suitability_rank";
export type EffectScope =
  | "self"
  | "other_base_pals"
  | "all_base_pals"
  | "unknown";
export type WorkApplicabilityEvidenceKind =
  | "explicit_work_suitability"
  | "generic_all_work_speed"
  | "target_pal_work_suitabilities"
  | "owner_pal_work_suitabilities"
  | "unknown";

export interface SourceReference {
  assetPath: string;
  rowId: string;
}

export interface GeneratedImageAsset {
  path: string;
  width: number;
  height: number;
  sha256: string;
  sourceAssetPath: string;
}

export interface WorkSuitabilityDefinition {
  id: string;
  nameKo: string;
  icon: GeneratedImageAsset | null;
}

export interface PalWorkSuitability {
  id: string;
  nameKo: string;
  level: number;
}

export interface PalRecord {
  id: string;
  paldeckNo: number | null;
  paldeckSuffix: string;
  nameKo: string;
  nameEn: string | null;
  workSuitabilities: PalWorkSuitability[];
  iconPath: string;
  iconWidth: number;
  iconHeight: number;
  iconSha256: string;
  partnerSkillId: string;
  sources: SourceReference[];
}

export interface RankValue {
  rankIndex: number;
  value: number;
}

export interface EffectRawFields {
  targetType: string;
  assignOthers: boolean | null;
  notAssignSelf: boolean | null;
  invokeWorker: boolean | null;
  invokeInBaseCamp: boolean | null;
  stackablePartnerSkillBySameTribe: boolean | null;
  workTypes: string[];
  mapObjectIds: string[];
}

export interface EffectRecord {
  id: string;
  metric: EffectMetric;
  workSuitabilityId: string | null;
  workSuitabilityNameKo: string | null;
  applicableWorkSuitabilityIds: string[];
  workApplicabilityEvidenceKind: WorkApplicabilityEvidenceKind;
  value: number;
  unit: "percent" | "level";
  scope: EffectScope;
  targetPalIds: string[];
  targetPalNamesKo: string[];
  conditionPalIds: string[];
  conditionPalNamesKo: string[];
  stackable: boolean | null;
  rankValues: RankValue[] | null;
  evidenceKind: string;
  raw: EffectRawFields;
}

export interface SkillAvailability {
  kind: string;
  lotteryWeight: number | null;
  evidenceKind: string | null;
}

export type PassiveUiFamily =
  | "common"
  | "rare_yellow"
  | "rare2_blue"
  | "world_tree"
  | "unknown";

export type PassiveUiStyleId =
  | "common"
  | "common_negative"
  | "rare_yellow"
  | "rare2_blue"
  | "world_tree";

export interface PassiveUiClassification {
  family: PassiveUiFamily;
  styleId: PassiveUiStyleId | null;
  evidenceKind: string;
}

export interface SkillRecord {
  id: string;
  gameId: string;
  kind: SkillKind;
  nameKo: string;
  descriptionKo: string;
  rawDescriptionKo: string | null;
  palIds: string[];
  effects: EffectRecord[];
  rank: number | null;
  availability: SkillAvailability;
  passiveUi: PassiveUiClassification | null;
  sources: SourceReference[];
}

export interface UiColorDefinition {
  linearR: number;
  linearG: number;
  linearB: number;
  alpha: number;
  cssHex: string;
}

export interface PassiveUiStyleDefinition {
  id: PassiveUiStyleId;
  nameKo: string;
  animationName: string;
  frameColor: UiColorDefinition;
  frameOverlayColor: UiColorDefinition;
  frameOverlayOpacity: number;
  backgroundColor: UiColorDefinition;
  textColor: UiColorDefinition;
  rankArrowColor: UiColorDefinition;
  gradientColor: UiColorDefinition;
  gradientOpacity: number;
  effectColor: UiColorDefinition;
  effectOpacity: number;
  prismOpacity: number;
  worldTreeEffectOpacity: number;
  evidenceKind: string;
}

export type WorldTreeUiLayerId =
  | "dissolve"
  | "scroll_slow"
  | "scroll_fast"
  | "base_gradient";

export interface WorldTreeUiLayerDefinition {
  id: WorldTreeUiLayerId;
  widgetName: string;
  materialAssetPath: string;
  color: UiColorDefinition;
  brushTintAlpha: number;
  textureKeys: string[];
}

export interface WorldTreeUiEffectDefinition {
  widgetName: string;
  opacity: number;
  layers: WorldTreeUiLayerDefinition[];
  evidenceKind: string;
}

export interface PassiveUiExample {
  styleId: PassiveUiStyleId;
  gameId: string;
  nameKo: string;
  descriptionKo: string;
  rank: number | null;
  sources: SourceReference[];
}

export interface GameUiAssets {
  passiveWidgetSourceAssetPath: string;
  passiveSkillTextures: Record<string, GeneratedImageAsset>;
  passiveSkillStyles: PassiveUiStyleDefinition[];
  worldTreeEffect: WorldTreeUiEffectDefinition;
  passiveSkillExamples: PassiveUiExample[];
  sourceAssets: string[];
}

export interface DatasetMeta {
  schemaVersion: string;
  steamAppId: string;
  steamBuildId: string;
  steamLanguage: string;
  localization: string;
  gameRelease: string;
  engineVersion: string;
  extractedAtUtc: string;
  pakRelativePath: string;
  pakSize: number;
  pakModifiedAtUtc: string;
  mappingFileName: string;
  mappingSha256: string;
  mountedArchiveCount: number;
  sourceAssets: string[];
  workSuitabilities: WorkSuitabilityDefinition[];
  uiAssets: GameUiAssets;
  counts: {
    palCount: number;
    partnerSkillCount: number;
    passiveSkillCount: number;
    effectCount: number;
    iconCount: number;
    workSuitabilityIconCount: number;
    passiveUiTextureCount: number;
    worldTreeEggPointCount: number;
  };
  validation: {
    status: "passed" | "failed";
    errors: string[];
  };
}

export interface Dataset {
  meta: DatasetMeta;
  pals: PalRecord[];
  skills: SkillRecord[];
}
