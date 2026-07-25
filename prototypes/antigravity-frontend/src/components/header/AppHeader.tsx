// 상단 파트너십/데이터셋 헤더 컴포넌트
import React from "react";
import type { DatasetMeta } from "../../types/dataset";
import { Badge } from "../common/Badge";

interface AppHeaderProps {
  meta: DatasetMeta;
}

export const AppHeader: React.FC<AppHeaderProps> = ({ meta }) => {
  return (
    <header className="app-header">
      <div className="app-header__branding">
        <div className="app-header__logo">
          <span className="logo-accent">PAL</span>
          <span className="logo-main">AUTO</span>
          <span className="logo-tag">REVERSE FINDER</span>
        </div>
        <div className="app-header__status">
          <span className="status-dot" aria-hidden="true" />
          <span className="status-text">
            PALWORLD 1.0 DATASET LOADED ({meta.counts.palCount} PALS / {meta.counts.effectCount} EFFECTS)
          </span>
        </div>
      </div>

      <div className="app-header__meta">
        <Badge variant="ghost" size="sm">
          BUILD ID: {meta.steamBuildId}
        </Badge>
        <Badge variant="ghost" size="sm">
          {meta.localization.toUpperCase()}
        </Badge>
      </div>
    </header>
  );
};
