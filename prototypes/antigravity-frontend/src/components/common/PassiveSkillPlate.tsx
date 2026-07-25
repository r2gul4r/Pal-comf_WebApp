import type { CSSProperties } from "react";
import { loadedDataset } from "../../services/dataLoader";
import type {
  GeneratedImageAsset,
  PassiveUiStyleDefinition,
  PassiveUiStyleId,
  WorldTreeUiLayerDefinition,
  WorldTreeUiLayerId,
} from "../../types/dataset";

interface PassiveSkillPlateProps {
  nameKo: string;
  rank: number | null;
  size?: "default" | "large";
  styleId: PassiveUiStyleId | null;
}

interface PassivePlateCssProperties extends CSSProperties {
  "--passive-background": string;
  "--passive-effect": string;
  "--passive-effect-opacity": number;
  "--passive-frame": string;
  "--passive-frame-image": string;
  "--passive-frame-overlay": string;
  "--passive-frame-overlay-image": string;
  "--passive-frame-overlay-opacity": number;
  "--passive-gradient": string;
  "--passive-gradient-image": string;
  "--passive-gradient-opacity": number;
  "--passive-prism-band-image": string;
  "--passive-prism-opacity": number;
  "--passive-prism-triangle-image": string;
  "--passive-rank-arrow": string;
  "--passive-rank-arrow-image": string;
  "--passive-text": string;
  "--passive-world-tree-base-color": string;
  "--passive-world-tree-base-opacity": number;
  "--passive-world-tree-dissolve-color": string;
  "--passive-world-tree-dissolve-image": string;
  "--passive-world-tree-dissolve-opacity": number;
  "--passive-world-tree-dissolve-target-image": string;
  "--passive-world-tree-opacity": number;
  "--passive-world-tree-scroll-color": string;
  "--passive-world-tree-scroll-fast-opacity": number;
  "--passive-world-tree-scroll-image": string;
  "--passive-world-tree-scroll-mask-image": string;
  "--passive-world-tree-scroll-slow-opacity": number;
}

const STYLE_BY_ID = new Map(
  loadedDataset.meta.uiAssets.passiveSkillStyles.map((style) => [
    style.id,
    style,
  ]),
);

function requireTexture(key: string): GeneratedImageAsset {
  const texture = loadedDataset.meta.uiAssets.passiveSkillTextures[key];
  if (!texture) {
    throw new Error(`패시브 UI 텍스처 누락: ${key}`);
  }
  return texture;
}

const TEXTURES = {
  backgroundGradient: requireTexture("backgroundGradient"),
  frame: requireTexture("frame"),
  frameOverlay: requireTexture("frameOverlay"),
  prismBand: requireTexture("prismBand"),
  prismTriangle: requireTexture("prismTriangle"),
  worldTreeDissolve: requireTexture("worldTreeDissolve"),
  worldTreeDissolveTarget: requireTexture("worldTreeDissolveTarget"),
  worldTreeScroll: requireTexture("worldTreeScroll"),
  worldTreeScrollMask: requireTexture("worldTreeScrollMask"),
};

const RANK_ARROW_TEXTURES = new Map<number, GeneratedImageAsset>(
  Array.from({ length: 6 }, (_, rank) => [
    rank,
    requireTexture(`rankArrow${rank}`),
  ]),
);

const WORLD_TREE_EFFECT = loadedDataset.meta.uiAssets.worldTreeEffect;

function requireWorldTreeLayer(
  id: WorldTreeUiLayerId,
): WorldTreeUiLayerDefinition {
  const layer = WORLD_TREE_EFFECT.layers.find((candidate) => candidate.id === id);
  if (!layer) {
    throw new Error(`세계수 UI 머티리얼 레이어 누락: ${id}`);
  }
  return layer;
}

const WORLD_TREE_LAYERS = {
  baseGradient: requireWorldTreeLayer("base_gradient"),
  dissolve: requireWorldTreeLayer("dissolve"),
  scrollFast: requireWorldTreeLayer("scroll_fast"),
  scrollSlow: requireWorldTreeLayer("scroll_slow"),
};

function getPassiveStyleDefinition(
  styleId: PassiveUiStyleId | null,
): PassiveUiStyleDefinition {
  const fallback = STYLE_BY_ID.get("common");
  const style = styleId ? STYLE_BY_ID.get(styleId) : fallback;
  if (!style || !fallback) {
    throw new Error("게임 패시브 UI 스타일 메타데이터가 비어있음");
  }
  return style;
}

function imageUrl(asset: GeneratedImageAsset): string {
  return `url("${asset.path}")`;
}

function getRankArrowTexture(rank: number | null): GeneratedImageAsset | null {
  if (rank === null || !Number.isInteger(rank) || rank === 0) {
    return null;
  }

  return RANK_ARROW_TEXTURES.get(Math.abs(rank)) ?? null;
}

export function PassiveSkillPlate({
  nameKo,
  rank,
  size = "default",
  styleId,
}: PassiveSkillPlateProps) {
  const styleDefinition = getPassiveStyleDefinition(styleId);
  const rankArrowTexture = getRankArrowTexture(rank);
  const cssVariables: PassivePlateCssProperties = {
    "--passive-background": styleDefinition.backgroundColor.cssHex,
    "--passive-effect": styleDefinition.effectColor.cssHex,
    "--passive-effect-opacity": styleDefinition.effectOpacity,
    "--passive-frame": styleDefinition.frameColor.cssHex,
    "--passive-frame-image": imageUrl(TEXTURES.frame),
    "--passive-frame-overlay": styleDefinition.frameOverlayColor.cssHex,
    "--passive-frame-overlay-image": imageUrl(TEXTURES.frameOverlay),
    "--passive-frame-overlay-opacity": styleDefinition.frameOverlayOpacity,
    "--passive-gradient": styleDefinition.gradientColor.cssHex,
    "--passive-gradient-image": imageUrl(TEXTURES.backgroundGradient),
    "--passive-gradient-opacity": styleDefinition.gradientOpacity,
    "--passive-prism-band-image": imageUrl(TEXTURES.prismBand),
    "--passive-prism-opacity": styleDefinition.prismOpacity,
    "--passive-prism-triangle-image": imageUrl(TEXTURES.prismTriangle),
    "--passive-rank-arrow": styleDefinition.rankArrowColor.cssHex,
    "--passive-rank-arrow-image": rankArrowTexture
      ? imageUrl(rankArrowTexture)
      : "none",
    "--passive-text": styleDefinition.textColor.cssHex,
    "--passive-world-tree-base-color":
      WORLD_TREE_LAYERS.baseGradient.color.cssHex,
    "--passive-world-tree-base-opacity":
      WORLD_TREE_LAYERS.baseGradient.brushTintAlpha,
    "--passive-world-tree-dissolve-color":
      WORLD_TREE_LAYERS.dissolve.color.cssHex,
    "--passive-world-tree-dissolve-image": imageUrl(
      TEXTURES.worldTreeDissolve,
    ),
    "--passive-world-tree-dissolve-opacity":
      WORLD_TREE_LAYERS.dissolve.brushTintAlpha,
    "--passive-world-tree-dissolve-target-image": imageUrl(
      TEXTURES.worldTreeDissolveTarget,
    ),
    "--passive-world-tree-opacity":
      styleDefinition.worldTreeEffectOpacity * WORLD_TREE_EFFECT.opacity,
    "--passive-world-tree-scroll-color":
      WORLD_TREE_LAYERS.scrollSlow.color.cssHex,
    "--passive-world-tree-scroll-fast-opacity":
      WORLD_TREE_LAYERS.scrollFast.brushTintAlpha,
    "--passive-world-tree-scroll-image": imageUrl(TEXTURES.worldTreeScroll),
    "--passive-world-tree-scroll-mask-image": imageUrl(
      TEXTURES.worldTreeScrollMask,
    ),
    "--passive-world-tree-scroll-slow-opacity":
      WORLD_TREE_LAYERS.scrollSlow.brushTintAlpha,
  };

  return (
    <div
      aria-label={`${styleDefinition.nameKo}: ${nameKo}${
        rank === null ? "" : `, 등급 ${rank}`
      }`}
      className={`passive-skill-plate passive-skill-plate--${styleDefinition.id} passive-skill-plate--${size}`}
      data-animation={styleDefinition.animationName}
      data-rank={rank ?? undefined}
      data-source-widget={
        loadedDataset.meta.uiAssets.passiveWidgetSourceAssetPath
      }
      style={cssVariables}
    >
      <span className="passive-skill-plate__background" aria-hidden="true" />
      <span className="passive-skill-plate__gradient" aria-hidden="true" />
      <span className="passive-skill-plate__prism" aria-hidden="true" />
      <span className="passive-skill-plate__effect" aria-hidden="true" />
      <span className="passive-skill-plate__world-tree" aria-hidden="true">
        <span
          className="passive-skill-plate__world-tree-base"
          data-material={WORLD_TREE_LAYERS.baseGradient.materialAssetPath}
        />
        <span
          className="passive-skill-plate__world-tree-dissolve"
          data-material={WORLD_TREE_LAYERS.dissolve.materialAssetPath}
        />
        <span
          className="passive-skill-plate__world-tree-scroll passive-skill-plate__world-tree-scroll--slow"
          data-material={WORLD_TREE_LAYERS.scrollSlow.materialAssetPath}
        />
        <span
          className="passive-skill-plate__world-tree-scroll passive-skill-plate__world-tree-scroll--fast"
          data-material={WORLD_TREE_LAYERS.scrollFast.materialAssetPath}
        />
      </span>
      <span className="passive-skill-plate__frame" aria-hidden="true" />
      <span
        className="passive-skill-plate__frame-overlay"
        aria-hidden="true"
      />
      <strong className="passive-skill-plate__name">{nameKo}</strong>
      {rankArrowTexture && (
        <span
          aria-hidden="true"
          className="passive-skill-plate__rank"
          title={`등급 ${rank}`}
        >
          <span
            className={`passive-skill-plate__rank-arrow${
              rank !== null && rank < 0
                ? " passive-skill-plate__rank-arrow--negative"
                : ""
            }`}
            data-texture={rankArrowTexture.sourceAssetPath}
            aria-hidden="true"
          />
        </span>
      )}
    </div>
  );
}
