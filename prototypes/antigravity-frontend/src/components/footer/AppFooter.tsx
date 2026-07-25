// 하단 데이터 검증 메타데이터 및 출처 푸터 컴포넌트
import React from "react";
import type { DatasetMeta } from "../../types/dataset";

interface AppFooterProps {
  meta: DatasetMeta;
}

function formatBytesGB(bytes: number): string {
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

function formatExtractedDate(isoString: string): string {
  try {
    return new Intl.DateTimeFormat("ko-KR", {
      dateStyle: "long",
      timeStyle: "short",
    }).format(new Date(isoString));
  } catch {
    return isoString;
  }
}

export const AppFooter: React.FC<AppFooterProps> = ({ meta }) => {
  return (
    <footer className="app-footer">
      <div className="footer-grid">
        <div className="footer-item">
          <span className="footer-item__label">데이터 검증 기준</span>
          <span className="footer-item__value">
            Steam App {meta.steamAppId} (Build {meta.steamBuildId}) · {meta.localization}
          </span>
        </div>

        <div className="footer-item">
          <span className="footer-item__label">추출 완료 시각</span>
          <span className="footer-item__value">
            {formatExtractedDate(meta.extractedAtUtc)}
          </span>
        </div>

        <div className="footer-item">
          <span className="footer-item__label">검증된 게임 원본 pak</span>
          <span className="footer-item__value">
            {meta.pakRelativePath} ({formatBytesGB(meta.pakSize)})
          </span>
        </div>
      </div>

      <p className="footer-disclaimer">
        본 도구는 로컬 Steam 팰월드 1.0 패키지 데이터를 기반으로 작동하며 게임 설치 파일 및 세이브를 절대로 변경하지 않음.
      </p>
    </footer>
  );
};
