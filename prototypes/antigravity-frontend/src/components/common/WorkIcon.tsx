import React from "react";
import { loadedDataset } from "../../services/dataLoader";

interface WorkIconProps {
  workId: string;
  className?: string;
  size?: number;
}

const WORK_SUITABILITIES_BY_ID = new Map(
  loadedDataset.meta.workSuitabilities.map((work) => [work.id, work]),
);

export const WorkIcon: React.FC<WorkIconProps> = ({
  workId,
  className = "",
  size = 28,
}) => {
  const work = WORK_SUITABILITIES_BY_ID.get(workId);
  if (!work?.icon) {
    return (
      <span
        aria-hidden="true"
        className={`work-icon work-icon--missing ${className}`}
        style={{ width: size, height: size }}
      >
        ?
      </span>
    );
  }

  return (
    <img
      alt=""
      aria-hidden="true"
      className={`work-icon work-icon--game-asset ${className}`}
      data-source-asset={work.icon.sourceAssetPath}
      decoding="async"
      height={size}
      src={work.icon.path}
      width={size}
    />
  );
};
