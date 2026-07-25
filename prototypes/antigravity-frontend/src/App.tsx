// 팰월드 1.0 거점 작업 강화 효과 역검색기 메인 애플리케이션 컴포넌트
import { useMemo, useState } from "react";
import { AppFooter } from "./components/footer/AppFooter";
import { AppHeader } from "./components/header/AppHeader";
import { WorldTreeEggMap } from "./components/map/WorldTreeEggMap";
import { AppViewTabs } from "./components/navigation/AppViewTabs";
import { PalResultCard } from "./components/cards/PalResultCard";
import { FilterToolbar } from "./components/search/FilterToolbar";
import { SearchBar } from "./components/search/SearchBar";
import { SearchStats } from "./components/search/SearchStats";
import { WorkCategorySelector } from "./components/search/WorkCategorySelector";
import {
  loadedDataset,
  validateLoadedDataset,
  validateWorldTreeEggMap,
  worldTreeEggMap,
} from "./services/dataLoader";
import {
  buildSearchHits,
  DEFAULT_FILTERS,
  filterSearchHits,
} from "./services/searchEngine";
import type { SearchFilters } from "./types/dataset";
import type { AppView } from "./components/navigation/appViewModel";

// 팰월드 12가지 대표 거점 작업 ID 목록
const ALLOWED_WORK_IDS = new Set([
  "EmitFlame",
  "Watering",
  "Seeding",
  "GenerateElectricity",
  "Handcraft",
  "Collection",
  "Deforest",
  "Mining",
  "ProductMedicine",
  "Cool",
  "Transport",
  "MonsterFarm",
]);

export function App() {
  const [activeView, setActiveView] = useState<AppView>("search");
  const [filters, setFilters] = useState<SearchFilters>(DEFAULT_FILTERS);

  // 로드된 데이터셋에 대한 1차 빌드
  const allHits = useMemo(() => buildSearchHits(loadedDataset), []);
  const datasetErrors = useMemo(
    () => [
      ...validateLoadedDataset(loadedDataset),
      ...validateWorldTreeEggMap(worldTreeEggMap),
    ],
    []
  );

  // 12개 거점 작업 카테고리 필터링
  const workSuitabilities = useMemo(
    () =>
      loadedDataset.meta.workSuitabilities.filter((work) =>
        ALLOWED_WORK_IDS.has(work.id)
      ),
    []
  );

  // 현재 필터 조건 기반 결과 계산
  const filteredHits = useMemo(
    () => filterSearchHits(allHits, filters),
    [allHits, filters]
  );

  // 필터 활성화 여부 계산
  const isFiltered = useMemo(
    () => JSON.stringify(filters) !== JSON.stringify(DEFAULT_FILTERS),
    [filters]
  );

  // 불변 필터 업데이트 핸들러
  const handleFilterChange = <K extends keyof SearchFilters>(
    key: K,
    value: SearchFilters[K]
  ) => {
    setFilters((current) => ({ ...current, [key]: value }));
  };

  // 필터 초기화
  const handleResetFilters = () => {
    setFilters(DEFAULT_FILTERS);
  };

  // 데이터 검증 오류 시 화면
  if (datasetErrors.length > 0) {
    return (
      <div className="app-container">
        <div className="empty-results">
          <span className="empty-results__icon" aria-hidden="true">!</span>
          <h2 className="empty-results__title">데이터셋 로드 검증 실패</h2>
          <p className="empty-results__desc">{datasetErrors.join(", ")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* 상단 파트너십 헤더 */}
      <AppHeader meta={loadedDataset.meta} />

      <AppViewTabs
        activeView={activeView}
        effectCount={allHits.length}
        eggPointCount={worldTreeEggMap.points.length}
        onChange={setActiveView}
      />

      <div
        id="app-view-panel-search"
        className="app-view-panel"
        role="tabpanel"
        aria-labelledby="app-view-tab-search"
        hidden={activeView !== "search"}
      >
        {/* 핵심 역검색 검색 제어 허브 */}
        <main className="search-hub">
          {/* 팰 및 스킬 실시간 텍스트 검색 바 */}
          <SearchBar
            value={filters.query}
            onChange={(query) => handleFilterChange("query", query)}
            onClear={() => handleFilterChange("query", "")}
          />

          {/* 12가지 작업 적성 시각적 그리드 필터 */}
          <WorkCategorySelector
            workSuitabilities={workSuitabilities}
            selectedId={filters.workSuitabilityId}
            onSelect={(id) => handleFilterChange("workSuitabilityId", id)}
          />

          {/* 세부 필터 (스킬 종류, 방식, 범위, 중첩) */}
          <FilterToolbar
            filters={filters}
            onFilterChange={handleFilterChange}
          />

          {/* 실시간 필터링 수치 및 리셋 */}
          <SearchStats
            totalHits={allHits.length}
            filteredHitsCount={filteredHits.length}
            isFiltered={isFiltered}
            onResetFilters={handleResetFilters}
          />
        </main>

        {/* 결과 팰 카드 그리드 리스트 */}
        <section className="results-section">
          {filteredHits.length > 0 ? (
            <div className="results-grid">
              {filteredHits.map((hit) => (
                <PalResultCard key={hit.id} hit={hit} />
              ))}
            </div>
          ) : (
            <div className="empty-results">
              <span className="empty-results__icon" aria-hidden="true">0</span>
              <h2 className="empty-results__title">조건에 일치하는 강화 효과가 없음</h2>
              <p className="empty-results__desc">
                선택한 작업 조합 또는 검색어 필터가 너무 구체적일 수 있음. 필터를 초기화하고 다시 조회를 시도해라.
              </p>
              <button
                type="button"
                className="reset-filters-btn"
                onClick={handleResetFilters}
              >
                필터 조건 초기화하기
              </button>
            </div>
          )}
        </section>
      </div>

      <div
        id="app-view-panel-egg-map"
        className="app-view-panel"
        role="tabpanel"
        aria-labelledby="app-view-tab-egg-map"
        hidden={activeView !== "egg-map"}
      >
        {/* 설치본 세계수 지도와 실제 알 스포너 좌표 */}
        <WorldTreeEggMap dataset={worldTreeEggMap} />
      </div>

      {/* 하단 출처 메타정보 푸터 */}
      <AppFooter meta={loadedDataset.meta} />
    </div>
  );
}

export default App;
