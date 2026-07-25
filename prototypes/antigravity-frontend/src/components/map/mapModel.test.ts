import { describe, expect, it } from "vitest";
import worldTreeEggMapRaw from "../../../../../data/generated/world-tree-eggs.json";
import { validateWorldTreeEggMap } from "../../services/dataLoader";
import type { WorldTreeEggMapDataset } from "../../types/worldTreeEggMap";
import {
  clampMapZoom,
  createMapZoomAnchor,
  formatGameCoordinate,
  MAX_MAP_ZOOM,
  MIN_MAP_ZOOM,
  resolveMapZoomScroll,
  toMarkerStyle,
} from "./mapModel";

const dataset = worldTreeEggMapRaw as WorldTreeEggMapDataset;

describe("world tree egg map model", () => {
  it("keeps the 30 extracted spawner indices complete and unique", () => {
    const indices = dataset.points.map((point) => point.index);

    expect(indices).toHaveLength(30);
    expect(new Set(indices).size).toBe(30);
    expect(indices).toEqual(Array.from({ length: 30 }, (_, index) => index + 1));
  });

  it("keeps every marker inside the extracted Tree map bounds", () => {
    for (const point of dataset.points) {
      expect(point.mapPosition.left).toBeGreaterThanOrEqual(0);
      expect(point.mapPosition.left).toBeLessThanOrEqual(1);
      expect(point.mapPosition.top).toBeGreaterThanOrEqual(0);
      expect(point.mapPosition.top).toBeLessThanOrEqual(1);

      const style = toMarkerStyle(point);
      expect(style.left).toMatch(/%$/);
      expect(style.top).toMatch(/%$/);
    }
  });

  it("matches the independently checked hollow-pillar coordinate", () => {
    const point = dataset.points.find((candidate) => candidate.index === 9);

    expect(point).toBeDefined();
    expect(point?.gameCoordinate).toEqual({ x: -1931, y: 1328 });
    expect(point && formatGameCoordinate(point)).toBe("(-1931, 1328)");
  });

  it("clamps map zoom to the supported range", () => {
    expect(MAX_MAP_ZOOM).toBe(5);
    expect(clampMapZoom(0)).toBe(MIN_MAP_ZOOM);
    expect(clampMapZoom(1.5)).toBe(1.5);
    expect(clampMapZoom(5)).toBe(MAX_MAP_ZOOM);
    expect(clampMapZoom(5.25)).toBe(MAX_MAP_ZOOM);
    expect(clampMapZoom(99)).toBe(MAX_MAP_ZOOM);
  });

  it("keeps the map point under the cursor fixed while zooming", () => {
    const anchor = createMapZoomAnchor({
      scrollLeft: 200,
      scrollTop: 120,
      contentWidth: 1000,
      contentHeight: 1000,
      offsetX: 300,
      offsetY: 180,
    });

    expect(anchor).toEqual({
      ratioX: 0.5,
      ratioY: 0.3,
      offsetX: 300,
      offsetY: 180,
    });
    expect(
      resolveMapZoomScroll({
        anchor,
        contentWidth: 2000,
        contentHeight: 2000,
        viewportWidth: 600,
        viewportHeight: 600,
      })
    ).toEqual({ scrollLeft: 700, scrollTop: 420 });
  });

  it("clamps cursor-centered zoom scroll at every map edge", () => {
    expect(
      resolveMapZoomScroll({
        anchor: { ratioX: 0, ratioY: 1, offsetX: 200, offsetY: 200 },
        contentWidth: 1500,
        contentHeight: 1500,
        viewportWidth: 500,
        viewportHeight: 500,
      })
    ).toEqual({ scrollLeft: 0, scrollTop: 1000 });
  });

  it("rejects invalid viewport geometry instead of producing NaN scroll", () => {
    expect(() =>
      createMapZoomAnchor({
        scrollLeft: 0,
        scrollTop: 0,
        contentWidth: 0,
        contentHeight: 100,
        offsetX: 0,
        offsetY: 0,
      })
    ).toThrow(RangeError);
  });

  it("keeps point 4 on its exact extracted percentage at every zoom", () => {
    const point = dataset.points.find((candidate) => candidate.index === 4);

    expect(point).toBeDefined();
    expect(point?.worldPosition).toEqual({
      x: 588770,
      y: -521620,
      z: 27175,
    });
    expect(point?.mapPosition.left).toBeCloseTo(0.8676992483842749, 14);
    expect(point?.mapPosition.top).toBeCloseTo(0.293678704026074, 14);
    expect(point && toMarkerStyle(point)).toEqual({
      left: "86.7699248384275%",
      top: "29.367870402607398%",
    });
  });

  it("passes the frontend runtime integrity checks", () => {
    expect(validateWorldTreeEggMap(dataset)).toEqual([]);
    expect(
      validateWorldTreeEggMap({ ...dataset, points: [] })
    ).toContain("세계수 알 스폰 포인트 30개가 완전하지 않음");
  });
});
