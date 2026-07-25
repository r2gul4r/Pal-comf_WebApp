import type { GeneratedImageAsset } from "./dataset";

export interface WorldTreeVector {
  x: number;
  y: number;
  z: number;
}

export interface WorldTreeMapBounds {
  min: WorldTreeVector;
  max: WorldTreeVector;
}

export interface WorldTreeAxisRange {
  worldMin: number;
  worldMax: number;
  displayMin: number;
  displayMax: number;
}

export interface WorldTreeDisplayCoordinateDefinition {
  x: WorldTreeAxisRange;
  y: WorldTreeAxisRange;
  sourceAssetPath: string;
  evidenceKind: string;
}

export interface WorldTreeEggSpawnerRules {
  itemId: string;
  itemNameKo: string;
  spawnerType: string;
  worldTreeEggProbability: number;
  respawnMinutesObtained: number;
  lotteryCooldownMinutes: number;
  sourceAssetPath: string;
}

export interface WorldTreeEggSpawnPoint {
  id: string;
  index: number;
  actorLabel: string;
  worldPosition: WorldTreeVector;
  gameCoordinate: {
    x: number;
    y: number;
  };
  mapPosition: {
    left: number;
    top: number;
  };
  sourcePackage: string;
}

export interface WorldTreeEggMapDataset {
  schemaVersion: string;
  regionId: string;
  regionNameKo: string;
  mapImage: GeneratedImageAsset;
  markerIcon: GeneratedImageAsset;
  worldBounds: WorldTreeMapBounds;
  displayCoordinates: WorldTreeDisplayCoordinateDefinition;
  spawner: WorldTreeEggSpawnerRules;
  points: WorldTreeEggSpawnPoint[];
  sourceAssets: string[];
}
