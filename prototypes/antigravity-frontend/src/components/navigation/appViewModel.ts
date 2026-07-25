export const APP_VIEWS = ["search", "egg-map"] as const;

export type AppView = (typeof APP_VIEWS)[number];

export function getNextAppView(
  currentView: AppView,
  key: string
): AppView | null {
  if (key === "Home") {
    return APP_VIEWS[0];
  }

  if (key === "End") {
    return APP_VIEWS[APP_VIEWS.length - 1];
  }

  if (key !== "ArrowLeft" && key !== "ArrowRight") {
    return null;
  }

  const direction = key === "ArrowRight" ? 1 : -1;
  const currentIndex = APP_VIEWS.indexOf(currentView);
  const nextIndex =
    (currentIndex + direction + APP_VIEWS.length) % APP_VIEWS.length;

  return APP_VIEWS[nextIndex];
}
