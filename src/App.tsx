import { useState } from "react";
import "./App.css";
import { gameDataset, validateDataset } from "./data";
import {
  buildSearchHits,
  DEFAULT_FILTERS,
  filterSearchHits,
  type SearchFilters,
  type SearchHit,
} from "./search";
import type {
  EffectMetric,
  EffectRecord,
  EffectScope,
  PalRecord,
  SkillKind,
  SkillRecord,
} from "./types";

const FILTER_WORK_IDS = new Set([
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

const WORK_GLYPHS: Record<string, string> = {
  EmitFlame: "♨",
  Watering: "◉",
  Seeding: "✦",
  GenerateElectricity: "ϟ",
  Handcraft: "⌁",
  Collection: "✣",
  Deforest: "⌇",
  Mining: "◆",
  ProductMedicine: "✚",
  Cool: "❄",
  Transport: "➜",
  MonsterFarm: "♧",
};

const SCOPE_LABELS: Record<EffectScope, string> = {
  self: "해당 팰 자신",
  other_base_pals: "거점의 다른 팰",
  all_base_pals: "거점 전체",
  unknown: "범위 미확인",
};

const METRIC_LABELS: Record<EffectMetric, string> = {
  work_suitability_rank: "작업 적성",
  work_speed: "작업 속도",
};

const KIND_LABELS: Record<SkillKind, string> = {
  partner: "파트너 스킬",
  passive: "특성",
};

const AVAILABILITY_LABELS: Record<string, string> = {
  specific_pal_partner_skill: "고유 파트너 스킬",
  standard_pal_trait_pool: "일반 특성 풀",
  rare_pal_trait: "희귀 팰 특성",
  world_tree_pal_trait_pool: "세계수 팰 특성 풀",
  unknown: "획득 경로 미확인",
};

const allHits = buildSearchHits(gameDataset);
const datasetErrors = validateDataset(gameDataset);

function formatBytes(bytes: number): string {
  return `${(bytes / 1024 / 1024 / 1024).toFixed(1)} GB`;
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatPaldeckNumber(pal: PalRecord): string {
  if (pal.paldeckNo === null) {
    return "No. —";
  }

  return `No. ${String(pal.paldeckNo).padStart(3, "0")}${pal.paldeckSuffix}`;
}

function stackabilityLabel(value: boolean | null): string {
  if (value === true) {
    return "중첩 가능";
  }

  if (value === false) {
    return "중첩 불가";
  }

  return "중첩 미확인";
}

function effectHeadline(effect: EffectRecord): string {
  const workName = effect.workSuitabilityNameKo ?? "전체 작업";
  if (effect.metric === "work_speed") {
    return `${workName} 속도 +${effect.value}%`;
  }

  return `${workName} 적성 +${effect.value}`;
}

function sourceLabel(assetPath: string): string {
  const segments = assetPath.split("/");
  return segments.at(-1) ?? assetPath;
}

interface FilterSelectProps<T extends string> {
  id: string;
  label: string;
  value: T;
  options: ReadonlyArray<{ value: T; label: string }>;
  onChange: (value: T) => void;
}

function FilterSelect<T extends string>({
  id,
  label,
  value,
  options,
  onChange,
}: FilterSelectProps<T>) {
  return (
    <label className="filter-field" htmlFor={id}>
      <span>{label}</span>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value as T)}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function PalIdentity({ pal }: { pal: PalRecord }) {
  return (
    <div className="pal-identity">
      <div className="pal-icon-shell">
        <img
          src={pal.iconPath}
          width={pal.iconWidth}
          height={pal.iconHeight}
          alt={`${pal.nameKo} 썸네일`}
          loading="lazy"
        />
      </div>
      <div>
        <span className="paldeck-number">{formatPaldeckNumber(pal)}</span>
        <h3>{pal.nameKo}</h3>
        <span className="game-id">{pal.id}</span>
      </div>
    </div>
  );
}

function TraitIdentity({ skill }: { skill: SkillRecord }) {
  return (
    <div className="pal-identity">
      <div className="trait-mark" aria-hidden="true">
        特
      </div>
      <div>
        <span className="paldeck-number">
          {AVAILABILITY_LABELS[skill.availability.kind] ??
            skill.availability.kind}
        </span>
        <h3>{skill.nameKo}</h3>
        <span className="game-id">{skill.gameId}</span>
      </div>
    </div>
  );
}

function RankStrip({ effect }: { effect: EffectRecord }) {
  if (!effect.rankValues) {
    return null;
  }

  return (
    <div className="rank-strip" aria-label="파트너 스킬 강화 단계별 수치">
      {effect.rankValues.map((rank) => (
        <span key={rank.rankIndex}>
          <b>{rank.rankIndex + 1}성</b>
          {effect.unit === "percent" ? `${rank.value}%` : `+${rank.value}`}
        </span>
      ))}
    </div>
  );
}

function WorkSuitabilityList({ pal }: { pal: PalRecord }) {
  return (
    <div className="suitability-list" aria-label={`${pal.nameKo} 기본 작업 적성`}>
      {pal.workSuitabilities.map((work) => (
        <span key={work.id}>
          <i aria-hidden="true">{WORK_GLYPHS[work.id] ?? "·"}</i>
          {work.nameKo}
          <b>Lv.{work.level}</b>
        </span>
      ))}
    </div>
  );
}

function ResultCard({ hit }: { hit: SearchHit }) {
  const { skill, effect, pal } = hit;

  return (
    <article className={`result-card result-card--${skill.kind}`}>
      <div className="result-card__topline">
        <span className={`kind-badge kind-badge--${skill.kind}`}>
          {KIND_LABELS[skill.kind]}
        </span>
        <span className="evidence-badge">게임 구조화 데이터</span>
      </div>

      {pal ? <PalIdentity pal={pal} /> : <TraitIdentity skill={skill} />}

      <div className="skill-block">
        <span className="skill-label">검색된 효과</span>
        <strong>{effectHeadline(effect)}</strong>
        <p>{skill.nameKo}</p>
      </div>

      <div className="effect-meta">
        <span>{SCOPE_LABELS[effect.scope]}</span>
        <span>{stackabilityLabel(effect.stackable)}</span>
        <span>{METRIC_LABELS[effect.metric]}</span>
      </div>

      {effect.targetPalNamesKo.length > 0 && (
        <p className="condition-note">
          적용 대상 팰: <b>{effect.targetPalNamesKo.join(", ")}</b>
        </p>
      )}
      {effect.conditionPalNamesKo.length > 0 && (
        <p className="condition-note">
          발동 조건 팰: <b>{effect.conditionPalNamesKo.join(", ")}</b>
        </p>
      )}

      <RankStrip effect={effect} />
      {pal && <WorkSuitabilityList pal={pal} />}

      <details>
        <summary>게임 설명과 출처 보기</summary>
        <p className="game-description">{skill.descriptionKo}</p>
        <ul className="source-list">
          {skill.sources.map((source) => (
            <li key={`${source.assetPath}:${source.rowId}`}>
              <span>{sourceLabel(source.assetPath)}</span>
              <code>{source.rowId}</code>
            </li>
          ))}
        </ul>
      </details>
    </article>
  );
}

function App() {
  const [filters, setFilters] = useState<SearchFilters>(DEFAULT_FILTERS);
  const workSuitabilities = gameDataset.meta.workSuitabilities.filter((work) =>
    FILTER_WORK_IDS.has(work.id),
  );
  const filteredHits = filterSearchHits(allHits, filters);
  const hasActiveFilters = JSON.stringify(filters) !== JSON.stringify(DEFAULT_FILTERS);

  function updateFilter<Key extends keyof SearchFilters>(
    key: Key,
    value: SearchFilters[Key],
  ) {
    setFilters((current) => ({ ...current, [key]: value }));
  }

  if (datasetErrors.length > 0) {
    return (
      <main className="fatal-state">
        <span>DATA ERROR</span>
        <h1>생성 데이터 검증에 실패함</h1>
        <ul>
          {datasetErrors.map((error) => (
            <li key={error}>{error}</li>
          ))}
        </ul>
      </main>
    );
  }

  return (
    <div className="app-shell">
      <header className="hero">
        <nav className="brandbar" aria-label="서비스 정보">
          <a className="brand" href="/" aria-label="Pal-comf 홈">
            <span>PAL</span>
            <b>COMF</b>
          </a>
          <div className="source-pill">
            <span className="pulse" aria-hidden="true" />
            설치본 데이터 검증 통과
          </div>
        </nav>

        <div className="hero__content">
          <div>
            <p className="eyebrow">PALWORLD 1.0 · BASE WORK FINDER</p>
            <h1>
              원하는 거점 효과,
              <br />
              <em>역으로 찾으면 됨.</em>
            </h1>
            <p className="hero__lead">
              작업 종류를 고르면 관련 특성·파트너 스킬·팰을 현재 PC의
              팰월드 데이터에서 바로 추림.
            </p>
          </div>
          <dl className="data-stamp">
            <div>
              <dt>Steam Build</dt>
              <dd>{gameDataset.meta.steamBuildId}</dd>
            </div>
            <div>
              <dt>추출 팰 / 효과</dt>
              <dd>
                {gameDataset.meta.counts.palCount} /{" "}
                {gameDataset.meta.counts.effectCount}
              </dd>
            </div>
            <div>
              <dt>원본 pak</dt>
              <dd>{formatBytes(gameDataset.meta.pakSize)}</dd>
            </div>
          </dl>
        </div>
      </header>

      <main>
        <section className="search-panel" aria-labelledby="filter-title">
          <div className="search-panel__heading">
            <div>
              <span className="section-index">01</span>
              <h2 id="filter-title">찾을 효과 설정</h2>
            </div>
            {hasActiveFilters && (
              <button
                className="text-button"
                type="button"
                onClick={() => setFilters(DEFAULT_FILTERS)}
              >
                필터 초기화
              </button>
            )}
          </div>

          <div className="filter-grid">
            <label className="filter-field filter-field--search" htmlFor="query">
              <span>팰·스킬 이름 검색</span>
              <input
                id="query"
                type="search"
                placeholder="예: 핑토, 수작업, 아누비스"
                value={filters.query}
                onChange={(event) => updateFilter("query", event.target.value)}
              />
            </label>

            <FilterSelect
              id="work-type"
              label="작업 종류"
              value={filters.workSuitabilityId}
              options={[
                { value: "all", label: "전체 작업" },
                ...workSuitabilities.map((work) => ({
                  value: work.id,
                  label: work.nameKo,
                })),
              ]}
              onChange={(value) => updateFilter("workSuitabilityId", value)}
            />

            <FilterSelect
              id="skill-kind"
              label="스킬 종류"
              value={filters.kind}
              options={[
                { value: "all", label: "특성 + 파트너 스킬" },
                { value: "passive", label: "특성만" },
                { value: "partner", label: "파트너 스킬만" },
              ]}
              onChange={(value) => updateFilter("kind", value)}
            />

            <FilterSelect
              id="metric"
              label="강화 방식"
              value={filters.metric}
              options={[
                { value: "all", label: "전체 방식" },
                { value: "work_suitability_rank", label: "작업 적성 레벨" },
                { value: "work_speed", label: "작업 속도" },
              ]}
              onChange={(value) => updateFilter("metric", value)}
            />

            <FilterSelect
              id="scope"
              label="적용 범위"
              value={filters.scope}
              options={[
                { value: "all", label: "전체 범위" },
                { value: "self", label: SCOPE_LABELS.self },
                {
                  value: "other_base_pals",
                  label: SCOPE_LABELS.other_base_pals,
                },
                { value: "all_base_pals", label: SCOPE_LABELS.all_base_pals },
                { value: "unknown", label: SCOPE_LABELS.unknown },
              ]}
              onChange={(value) => updateFilter("scope", value)}
            />

            <FilterSelect
              id="stackability"
              label="중첩 여부"
              value={filters.stackability}
              options={[
                { value: "any", label: "전체" },
                { value: "stackable", label: "중첩 가능" },
                { value: "not_stackable", label: "중첩 불가" },
                { value: "unknown", label: "확인 안 됨" },
              ]}
              onChange={(value) => updateFilter("stackability", value)}
            />
          </div>
        </section>

        <section className="results" aria-labelledby="results-title">
          <div className="results__heading">
            <div>
              <span className="section-index">02</span>
              <h2 id="results-title">검색 결과</h2>
            </div>
            <p aria-live="polite">
              <b>{filteredHits.length}</b>개 효과
            </p>
          </div>

          {filteredHits.length > 0 ? (
            <div className="result-grid">
              {filteredHits.map((hit) => (
                <ResultCard key={hit.id} hit={hit} />
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <span>0 RESULT</span>
              <h3>조건에 맞는 효과가 없음</h3>
              <p>
                현재 데이터에 없는 조합이거나 필터가 너무 빡셈. 초기화하고
                하나씩 좁혀라.
              </p>
              <button type="button" onClick={() => setFilters(DEFAULT_FILTERS)}>
                전체 결과 다시 보기
              </button>
            </div>
          )}
        </section>
      </main>

      <footer>
        <div>
          <b>데이터 기준</b>
          <span>
            Steam App {gameDataset.meta.steamAppId} · Build{" "}
            {gameDataset.meta.steamBuildId} · 한국어
          </span>
        </div>
        <div>
          <b>추출 시각</b>
          <span>{formatDate(gameDataset.meta.extractedAtUtc)}</span>
        </div>
        <div>
          <b>읽은 원본</b>
          <span>{gameDataset.meta.pakRelativePath}</span>
        </div>
        <p>
          게임 원본과 세이브는 수정하지 않음. 외부 사이트가 아니라 현재 설치
          pak의 구조화 값이 판정 기준임.
        </p>
      </footer>
    </div>
  );
}

export default App;
