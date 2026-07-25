import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import type {
  WorldTreeEggMapDataset,
  WorldTreeEggSpawnPoint,
} from "../../types/worldTreeEggMap";
import {
  clampMapZoom,
  createMapZoomAnchor,
  formatGameCoordinate,
  MAP_ZOOM_STEP,
  MAP_WHEEL_ZOOM_STEP,
  MAX_MAP_ZOOM,
  MIN_MAP_ZOOM,
  resolveMapZoomScroll,
  toMarkerStyle,
  type MapZoomAnchor,
} from "./mapModel";

interface WorldTreeEggMapProps {
  dataset: WorldTreeEggMapDataset;
}

interface MapDragState {
  pointerId: number;
  startX: number;
  startY: number;
  scrollLeft: number;
  scrollTop: number;
}

function PointButton({
  point,
  iconPath,
  selected,
  onSelect,
}: {
  point: WorldTreeEggSpawnPoint;
  iconPath: string;
  selected: boolean;
  onSelect: (point: WorldTreeEggSpawnPoint) => void;
}) {
  return (
    <button
      type="button"
      className={`egg-map-marker${selected ? " egg-map-marker--selected" : ""}`}
      style={toMarkerStyle(point)}
      aria-label={`불길한 알 스폰 포인트 ${point.index}, 좌표 ${formatGameCoordinate(point)}`}
      aria-pressed={selected}
      title={`#${String(point.index).padStart(2, "0")} ${formatGameCoordinate(point)}`}
      onClick={() => onSelect(point)}
    >
      <img src={iconPath} alt="" aria-hidden="true" draggable={false} />
      <span>{point.index}</span>
    </button>
  );
}

export function WorldTreeEggMap({ dataset }: WorldTreeEggMapProps) {
  const initialPoint =
    dataset.points.find((point) => point.index === 9) ?? dataset.points[0];
  const [selectedPointId, setSelectedPointId] = useState(initialPoint?.id ?? "");
  const [zoom, setZoom] = useState(MIN_MAP_ZOOM);
  const [isDragging, setIsDragging] = useState(false);
  const viewportRef = useRef<HTMLDivElement>(null);
  const pendingZoomAnchorRef = useRef<MapZoomAnchor | null>(null);
  const dragStateRef = useRef<MapDragState | null>(null);
  const selectedPoint =
    dataset.points.find((point) => point.id === selectedPointId) ?? initialPoint;

  const requestZoom = useCallback(
    (nextZoom: number, clientPosition?: { x: number; y: number }) => {
      const boundedZoom = clampMapZoom(nextZoom);
      const viewport = viewportRef.current;

      if (!viewport || boundedZoom === zoom) {
        return;
      }

      const rect = viewport.getBoundingClientRect();
      const offsetX = clientPosition
        ? clientPosition.x - rect.left
        : viewport.clientWidth / 2;
      const offsetY = clientPosition
        ? clientPosition.y - rect.top
        : viewport.clientHeight / 2;

      pendingZoomAnchorRef.current = createMapZoomAnchor({
        scrollLeft: viewport.scrollLeft,
        scrollTop: viewport.scrollTop,
        contentWidth: viewport.scrollWidth,
        contentHeight: viewport.scrollHeight,
        offsetX,
        offsetY,
      });
      setZoom(boundedZoom);
    },
    [zoom]
  );

  useLayoutEffect(() => {
    const viewport = viewportRef.current;
    const anchor = pendingZoomAnchorRef.current;

    if (!viewport || !anchor) {
      return;
    }

    const nextScroll = resolveMapZoomScroll({
      anchor,
      contentWidth: viewport.scrollWidth,
      contentHeight: viewport.scrollHeight,
      viewportWidth: viewport.clientWidth,
      viewportHeight: viewport.clientHeight,
    });
    viewport.scrollLeft = nextScroll.scrollLeft;
    viewport.scrollTop = nextScroll.scrollTop;
    pendingZoomAnchorRef.current = null;
  }, [zoom]);

  useEffect(() => {
    const viewport = viewportRef.current;

    if (!viewport) {
      return;
    }

    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();

      if (event.deltaY === 0) {
        return;
      }

      requestZoom(
        zoom + (event.deltaY < 0 ? MAP_WHEEL_ZOOM_STEP : -MAP_WHEEL_ZOOM_STEP),
        { x: event.clientX, y: event.clientY }
      );
    };

    viewport.addEventListener("wheel", handleWheel, { passive: false });

    return () => viewport.removeEventListener("wheel", handleWheel);
  }, [requestZoom, zoom]);

  if (!selectedPoint) {
    return null;
  }

  const selectPoint = (point: WorldTreeEggSpawnPoint) => {
    setSelectedPointId(point.id);
  };

  const changeZoom = (delta: number) => {
    requestZoom(zoom + delta);
  };

  const startDragging = (event: ReactPointerEvent<HTMLDivElement>) => {
    const viewport = viewportRef.current;
    const target = event.target;

    if (
      !viewport ||
      !event.isPrimary ||
      event.button !== 0 ||
      (target instanceof Element && target.closest("button"))
    ) {
      return;
    }

    dragStateRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      scrollLeft: viewport.scrollLeft,
      scrollTop: viewport.scrollTop,
    };
    viewport.setPointerCapture(event.pointerId);
    setIsDragging(true);
    event.preventDefault();
  };

  const dragMap = (event: ReactPointerEvent<HTMLDivElement>) => {
    const viewport = viewportRef.current;
    const dragState = dragStateRef.current;

    if (!viewport || !dragState || dragState.pointerId !== event.pointerId) {
      return;
    }

    viewport.scrollLeft = dragState.scrollLeft - (event.clientX - dragState.startX);
    viewport.scrollTop = dragState.scrollTop - (event.clientY - dragState.startY);
    event.preventDefault();
  };

  const stopDragging = (event: ReactPointerEvent<HTMLDivElement>) => {
    const viewport = viewportRef.current;
    const dragState = dragStateRef.current;

    if (!viewport || !dragState || dragState.pointerId !== event.pointerId) {
      return;
    }

    if (viewport.hasPointerCapture(event.pointerId)) {
      viewport.releasePointerCapture(event.pointerId);
    }
    dragStateRef.current = null;
    setIsDragging(false);
  };

  return (
    <section className="egg-map-section" aria-labelledby="egg-map-title">
      <header className="egg-map-section__header">
        <div className="egg-map-section__identity">
          <img
            className="egg-map-section__item-icon"
            src={dataset.markerIcon.path}
            alt=""
            aria-hidden="true"
          />
          <div>
            <span className="egg-map-section__eyebrow">WORLD TREE · LOCAL PAK DATA</span>
            <h2 id="egg-map-title">{dataset.spawner.itemNameKo} 스폰 지도</h2>
            <p>
              설치본의 세계수 맵과 알 스포너 월드 좌표를 그대로 결합한 지도임.
            </p>
          </div>
        </div>
        <div className="egg-map-section__stats" aria-label="지도 데이터 요약">
          <span><strong>{dataset.points.length}</strong> 포인트</span>
          <span><strong>{dataset.spawner.respawnMinutesObtained}</strong>분 재생성</span>
          <span><strong>{dataset.spawner.worldTreeEggProbability}</strong> 원본 추첨값</span>
        </div>
      </header>

      <p className="egg-map-section__notice">
        알이 무조건 놓이는 확정 출현 지도는 아님. 표시된 곳은 게임 데이터에 배치된
        세계수 알 추첨 포인트고, 서버 상태와 추첨 결과에 따라 비어 있을 수 있음.
      </p>

      <div className="egg-map-layout">
        <div className="egg-map-viewer">
          <div className="egg-map-toolbar" aria-label="지도 확대 축소">
            <span>인게임 세계수 지도</span>
            <div>
              <button
                type="button"
                aria-label="지도 축소"
                disabled={zoom <= MIN_MAP_ZOOM}
                onClick={() => changeZoom(-MAP_ZOOM_STEP)}
              >
                −
              </button>
              <output aria-live="polite">{Math.round(zoom * 100)}%</output>
              <button
                type="button"
                aria-label="지도 확대"
                disabled={zoom >= MAX_MAP_ZOOM}
                onClick={() => changeZoom(MAP_ZOOM_STEP)}
              >
                +
              </button>
            </div>
          </div>

          <div
            ref={viewportRef}
            className={`egg-map-viewport${isDragging ? " egg-map-viewport--dragging" : ""}`}
            aria-label="드래그와 마우스 휠로 이동 및 확대할 수 있는 세계수 지도"
            tabIndex={0}
            onPointerDown={startDragging}
            onPointerMove={dragMap}
            onPointerUp={stopDragging}
            onPointerCancel={stopDragging}
          >
            <div
              className="egg-map-canvas"
              style={{ width: `${zoom * 100}%` }}
            >
              <img
                className="egg-map-canvas__image"
                src={dataset.mapImage.path}
                alt="팰월드 세계수 지역 인게임 지도"
                draggable={false}
              />
              {dataset.points.map((point) => (
                <PointButton
                  key={point.id}
                  point={point}
                  iconPath={dataset.markerIcon.path}
                  selected={point.id === selectedPoint.id}
                  onSelect={selectPoint}
                />
              ))}
            </div>
          </div>
          <p className="egg-map-viewer__hint">
            드래그 이동 · 휠 확대/축소 · 알 아이콘 클릭 → 인게임 좌표 확인
          </p>
        </div>

        <aside className="egg-map-details" aria-label="선택한 알 스폰 포인트">
          <div className="egg-map-selected" aria-live="polite">
            <span className="egg-map-selected__label">
              선택 포인트 #{String(selectedPoint.index).padStart(2, "0")}
            </span>
            <strong>{formatGameCoordinate(selectedPoint)}</strong>
            <dl>
              <div>
                <dt>고도 Z</dt>
                <dd>{Math.round(selectedPoint.worldPosition.z).toLocaleString("ko-KR")}</dd>
              </div>
              <div>
                <dt>재생성</dt>
                <dd>{dataset.spawner.respawnMinutesObtained}분</dd>
              </div>
            </dl>
            <code>{selectedPoint.actorLabel}</code>
          </div>

          <div className="egg-map-point-list" aria-label="전체 스폰 포인트 좌표">
            <h3>전체 좌표</h3>
            <div>
              {dataset.points.map((point) => (
                <button
                  key={point.id}
                  type="button"
                  className={point.id === selectedPoint.id ? "is-selected" : ""}
                  aria-pressed={point.id === selectedPoint.id}
                  onClick={() => selectPoint(point)}
                >
                  <span>#{String(point.index).padStart(2, "0")}</span>
                  {formatGameCoordinate(point)}
                </button>
              ))}
            </div>
          </div>

          <details className="egg-map-sources">
            <summary>게임 파일 근거</summary>
            <dl>
              <div>
                <dt>지도</dt>
                <dd>{dataset.mapImage.sourceAssetPath}</dd>
              </div>
              <div>
                <dt>알 아이콘</dt>
                <dd>{dataset.markerIcon.sourceAssetPath}</dd>
              </div>
              <div>
                <dt>선택 좌표</dt>
                <dd>{selectedPoint.sourcePackage}</dd>
              </div>
            </dl>
          </details>
        </aside>
      </div>
    </section>
  );
}
