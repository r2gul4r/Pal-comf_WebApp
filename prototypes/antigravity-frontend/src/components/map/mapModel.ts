import type { WorldTreeEggSpawnPoint } from "../../types/worldTreeEggMap";

export const MIN_MAP_ZOOM = 1;
export const MAX_MAP_ZOOM = 5;
export const MAP_ZOOM_STEP = 0.5;
export const MAP_WHEEL_ZOOM_STEP = 0.25;

export interface MapZoomAnchor {
  ratioX: number;
  ratioY: number;
  offsetX: number;
  offsetY: number;
}

interface CreateMapZoomAnchorInput {
  scrollLeft: number;
  scrollTop: number;
  contentWidth: number;
  contentHeight: number;
  offsetX: number;
  offsetY: number;
}

interface ResolveMapZoomScrollInput {
  anchor: MapZoomAnchor;
  contentWidth: number;
  contentHeight: number;
  viewportWidth: number;
  viewportHeight: number;
}

function assertPositiveDimension(value: number, label: string): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new RangeError(`${label} must be a positive finite number`);
  }
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}

export function clampMapZoom(zoom: number): number {
  return Math.min(MAX_MAP_ZOOM, Math.max(MIN_MAP_ZOOM, zoom));
}

export function createMapZoomAnchor({
  scrollLeft,
  scrollTop,
  contentWidth,
  contentHeight,
  offsetX,
  offsetY,
}: CreateMapZoomAnchorInput): MapZoomAnchor {
  assertPositiveDimension(contentWidth, "contentWidth");
  assertPositiveDimension(contentHeight, "contentHeight");

  return {
    ratioX: clamp((scrollLeft + offsetX) / contentWidth, 0, 1),
    ratioY: clamp((scrollTop + offsetY) / contentHeight, 0, 1),
    offsetX,
    offsetY,
  };
}

export function resolveMapZoomScroll({
  anchor,
  contentWidth,
  contentHeight,
  viewportWidth,
  viewportHeight,
}: ResolveMapZoomScrollInput) {
  assertPositiveDimension(contentWidth, "contentWidth");
  assertPositiveDimension(contentHeight, "contentHeight");
  assertPositiveDimension(viewportWidth, "viewportWidth");
  assertPositiveDimension(viewportHeight, "viewportHeight");

  const maxScrollLeft = Math.max(0, contentWidth - viewportWidth);
  const maxScrollTop = Math.max(0, contentHeight - viewportHeight);

  return {
    scrollLeft: clamp(
      anchor.ratioX * contentWidth - anchor.offsetX,
      0,
      maxScrollLeft
    ),
    scrollTop: clamp(
      anchor.ratioY * contentHeight - anchor.offsetY,
      0,
      maxScrollTop
    ),
  };
}

export function toMarkerStyle(point: WorldTreeEggSpawnPoint) {
  return {
    left: `${point.mapPosition.left * 100}%`,
    top: `${point.mapPosition.top * 100}%`,
  };
}

export function formatGameCoordinate(
  point: WorldTreeEggSpawnPoint
): string {
  return `(${point.gameCoordinate.x}, ${point.gameCoordinate.y})`;
}
