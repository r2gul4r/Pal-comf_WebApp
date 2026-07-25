import { useRef, type KeyboardEvent } from "react";
import {
  APP_VIEWS,
  getNextAppView,
  type AppView,
} from "./appViewModel";

interface AppViewTabsProps {
  activeView: AppView;
  effectCount: number;
  eggPointCount: number;
  onChange: (view: AppView) => void;
}

interface AppViewMetadata {
  id: AppView;
  index: string;
  label: string;
  description: string;
  countLabel: string;
}

export function AppViewTabs({
  activeView,
  effectCount,
  eggPointCount,
  onChange,
}: AppViewTabsProps) {
  const tabRefs = useRef<Record<AppView, HTMLButtonElement | null>>({
    search: null,
    "egg-map": null,
  });
  const views: AppViewMetadata[] = [
    {
      id: "search",
      index: "01",
      label: "거점 강화 역검색",
      description: "특성 · 파트너 스킬",
      countLabel: `${effectCount} 효과`,
    },
    {
      id: "egg-map",
      index: "02",
      label: "불길한 알 스폰 지도",
      description: "세계수 게임 데이터",
      countLabel: `${eggPointCount} 포인트`,
    },
  ];

  const handleKeyDown = (
    event: KeyboardEvent<HTMLButtonElement>,
    currentView: AppView
  ) => {
    const nextView = getNextAppView(currentView, event.key);

    if (!nextView) {
      return;
    }

    event.preventDefault();
    onChange(nextView);
    tabRefs.current[nextView]?.focus();
  };

  return (
    <nav className="app-view-tabs" aria-label="웹앱 기능 선택">
      <div role="tablist" aria-label="팰월드 데이터 도구">
        {views.map((view) => {
          const selected = view.id === activeView;

          return (
            <button
              key={view.id}
              ref={(element) => {
                tabRefs.current[view.id] = element;
              }}
              id={`app-view-tab-${view.id}`}
              type="button"
              role="tab"
              className={`app-view-tab app-view-tab--${view.id}${selected ? " is-active" : ""}`}
              aria-controls={`app-view-panel-${view.id}`}
              aria-selected={selected}
              tabIndex={selected ? 0 : -1}
              onClick={() => onChange(view.id)}
              onKeyDown={(event) => handleKeyDown(event, view.id)}
            >
              <span className="app-view-tab__index" aria-hidden="true">
                {view.index}
              </span>
              <span className="app-view-tab__copy">
                <strong>{view.label}</strong>
                <small>{view.description}</small>
              </span>
              <span className="app-view-tab__count">{view.countLabel}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

export { APP_VIEWS };
