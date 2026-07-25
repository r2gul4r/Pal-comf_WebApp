import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import App from "./App";

describe("App", () => {
  it("설치본 데이터에서 핑토 파트너 스킬을 검색함", () => {
    render(<App />);

    fireEvent.change(screen.getByLabelText("팰·스킬 이름 검색"), {
      target: { value: "핑토" },
    });

    expect(screen.getByRole("heading", { name: "핑토" })).toBeInTheDocument();
    expect(screen.getByText("항상 웃는 공주 토끼")).toBeInTheDocument();
    expect(screen.getByText("수작업 적성 +1")).toBeInTheDocument();
  });

  it("결과가 없으면 초기화 동선을 노출함", () => {
    render(<App />);

    fireEvent.change(screen.getByLabelText("팰·스킬 이름 검색"), {
      target: { value: "존재하지않는팰이름" },
    });

    expect(screen.getByText("조건에 맞는 효과가 없음")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "전체 결과 다시 보기" }),
    ).toBeInTheDocument();
  });
});
