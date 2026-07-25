// 팰 초상화 Hexagon/Octagon 게임 프레임 컴포넌트
import React, { useState } from "react";
import type { PalRecord } from "../../types/dataset";

interface PalPortraitProps {
  pal: PalRecord;
}

function formatPaldeckNumber(pal: PalRecord): string {
  if (pal.paldeckNo === null) return "No. —";
  return `No. ${String(pal.paldeckNo).padStart(3, "0")}${pal.paldeckSuffix}`;
}

export const PalPortrait: React.FC<PalPortraitProps> = ({ pal }) => {
  const [imageError, setImageError] = useState(false);

  return (
    <div className="pal-portrait">
      <div className="portrait-hex">
        {!imageError ? (
          <img
            src={pal.iconPath}
            width={pal.iconWidth}
            height={pal.iconHeight}
            alt={`${pal.nameKo} 썸네일`}
            loading="lazy"
            onError={() => setImageError(true)}
            className="portrait-img"
          />
        ) : (
          <div className="portrait-fallback">{pal.nameKo.slice(0, 2)}</div>
        )}
      </div>
      <div className="portrait-info">
        <span className="paldeck-no">{formatPaldeckNumber(pal)}</span>
        <h3 className="pal-name">{pal.nameKo}</h3>
        <span className="game-id-code">{pal.id}</span>
      </div>
    </div>
  );
};
