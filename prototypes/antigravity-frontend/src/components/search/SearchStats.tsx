// 검색 결과 카운트 및 필터 상태 조작 바 컴포넌트
import React from "react";

interface SearchStatsProps {
  totalHits: number;
  filteredHitsCount: number;
  isFiltered: boolean;
  onResetFilters: () => void;
}

export const SearchStats: React.FC<SearchStatsProps> = ({
  totalHits,
  filteredHitsCount,
  isFiltered,
  onResetFilters,
}) => {
  return (
    <div className="search-stats">
      <div className="search-stats__count" aria-live="polite">
        <span className="count-label">검색된 강화 효과</span>
        <span className="count-number">{filteredHitsCount}</span>
        <span className="count-total">/ 총 {totalHits}개</span>
      </div>

      {isFiltered && (
        <button
          type="button"
          className="reset-filters-btn"
          onClick={onResetFilters}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
          </svg>
          필터 초기화
        </button>
      )}
    </div>
  );
};
