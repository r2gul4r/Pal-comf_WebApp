// 검색어 입력 바 컴포넌트
import React from "react";

interface SearchBarProps {
  value: string;
  onChange: (query: string) => void;
  onClear: () => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChange,
  onClear,
}) => {
  return (
    <div className="search-bar">
      <div className="search-bar__icon-wrapper" aria-hidden="true">
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      </div>

      <input
        type="text"
        className="search-bar__input"
        placeholder="팰 이름, 스킬명 또는 효과 검색 (예: 핑토, 수작업, 아누비스)..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label="팰 및 스킬 검색어 입력"
      />

      {value.length > 0 && (
        <button
          type="button"
          className="search-bar__clear-btn"
          onClick={onClear}
          title="검색어 지우기"
        >
          ✕
        </button>
      )}
    </div>
  );
};
