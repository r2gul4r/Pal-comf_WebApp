import { describe, expect, it } from "vitest";
import { getNextAppView } from "./appViewModel";

describe("app view tab navigation", () => {
  it("moves right and wraps to the first tab", () => {
    expect(getNextAppView("search", "ArrowRight")).toBe("egg-map");
    expect(getNextAppView("egg-map", "ArrowRight")).toBe("search");
  });

  it("moves left and wraps to the last tab", () => {
    expect(getNextAppView("egg-map", "ArrowLeft")).toBe("search");
    expect(getNextAppView("search", "ArrowLeft")).toBe("egg-map");
  });

  it("supports Home and End boundaries", () => {
    expect(getNextAppView("egg-map", "Home")).toBe("search");
    expect(getNextAppView("search", "End")).toBe("egg-map");
  });

  it("leaves unrelated keys to the browser", () => {
    expect(getNextAppView("search", "Tab")).toBeNull();
    expect(getNextAppView("search", "Enter")).toBeNull();
  });
});
