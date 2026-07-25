from __future__ import annotations

from pathlib import Path
from xml.sax.saxutils import escape

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    Flowable,
    KeepTogether,
    PageBreak,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)


ROOT = Path(__file__).resolve().parents[2]
OUTPUT_PATH = ROOT / "output" / "pdf" / "pal-comf-work-conversation-log.pdf"

FONT_REGULAR_PATH = Path(r"C:\Windows\Fonts\malgun.ttf")
FONT_BOLD_PATH = Path(r"C:\Windows\Fonts\malgunbd.ttf")
FONT_REGULAR = "MalgunGothic"
FONT_BOLD = "MalgunGothicBold"

PAGE_W, PAGE_H = A4
CONTENT_W = PAGE_W - 28 * mm

INK = colors.HexColor("#17212B")
MUTED = colors.HexColor("#526170")
DIM = colors.HexColor("#7C8994")
BG = colors.HexColor("#FFFFFF")
PANEL = colors.HexColor("#F7F9FB")
PANEL_2 = colors.HexColor("#EEF3F6")
LINE = colors.HexColor("#D6E0E6")
CYAN = colors.HexColor("#007E78")
CYAN_DARK = colors.HexColor("#E4F6F4")
BLUE = colors.HexColor("#2563A8")
YELLOW = colors.HexColor("#A66B00")
ORANGE = colors.HexColor("#B95712")
RED = colors.HexColor("#BE3541")
GREEN = colors.HexColor("#147A54")
PURPLE = colors.HexColor("#6F4BAD")


def register_fonts() -> None:
    if not FONT_REGULAR_PATH.exists() or not FONT_BOLD_PATH.exists():
        raise FileNotFoundError("맑은 고딕 폰트를 찾지 못했습니다.")
    pdfmetrics.registerFont(TTFont(FONT_REGULAR, str(FONT_REGULAR_PATH)))
    pdfmetrics.registerFont(TTFont(FONT_BOLD, str(FONT_BOLD_PATH)))


def escaped(text: str) -> str:
    return escape(text).replace("\n", "<br/>")


STYLES = {
    "eyebrow": ParagraphStyle(
        "eyebrow",
        fontName=FONT_BOLD,
        fontSize=8.2,
        leading=11,
        textColor=CYAN,
        spaceAfter=4,
    ),
    "title": ParagraphStyle(
        "title",
        fontName=FONT_BOLD,
        fontSize=24,
        leading=31,
        textColor=INK,
        spaceAfter=5,
    ),
    "subtitle": ParagraphStyle(
        "subtitle",
        fontName=FONT_REGULAR,
        fontSize=10.5,
        leading=16,
        textColor=MUTED,
        spaceAfter=12,
    ),
    "page_title": ParagraphStyle(
        "page_title",
        fontName=FONT_BOLD,
        fontSize=18,
        leading=24,
        textColor=INK,
        spaceAfter=4,
    ),
    "page_lead": ParagraphStyle(
        "page_lead",
        fontName=FONT_REGULAR,
        fontSize=9,
        leading=14,
        textColor=MUTED,
        spaceAfter=10,
    ),
    "section": ParagraphStyle(
        "section",
        fontName=FONT_BOLD,
        fontSize=10.5,
        leading=14,
        textColor=INK,
        spaceBefore=3,
        spaceAfter=6,
    ),
    "body": ParagraphStyle(
        "body",
        fontName=FONT_REGULAR,
        fontSize=8.6,
        leading=13.5,
        textColor=INK,
    ),
    "body_muted": ParagraphStyle(
        "body_muted",
        fontName=FONT_REGULAR,
        fontSize=8.2,
        leading=12.5,
        textColor=MUTED,
    ),
    "small": ParagraphStyle(
        "small",
        fontName=FONT_REGULAR,
        fontSize=7.1,
        leading=10.5,
        textColor=MUTED,
    ),
    "card_title": ParagraphStyle(
        "card_title",
        fontName=FONT_BOLD,
        fontSize=8.4,
        leading=11.5,
        textColor=CYAN,
        spaceAfter=3,
    ),
    "card_body": ParagraphStyle(
        "card_body",
        fontName=FONT_REGULAR,
        fontSize=7.7,
        leading=11.4,
        textColor=INK,
    ),
    "center": ParagraphStyle(
        "center",
        fontName=FONT_REGULAR,
        fontSize=8.3,
        leading=12,
        textColor=INK,
        alignment=TA_CENTER,
    ),
    "center_bold": ParagraphStyle(
        "center_bold",
        fontName=FONT_BOLD,
        fontSize=8.4,
        leading=12,
        textColor=INK,
        alignment=TA_CENTER,
    ),
}


class ChatBubble(Flowable):
    def __init__(
        self,
        label: str,
        text: str,
        role: str,
        source: str,
        max_width: float | None = None,
    ) -> None:
        super().__init__()
        self.label_text = label
        self.body_text = text
        self.role = role
        self.source = source
        self.max_width = max_width or (CONTENT_W * 0.91)
        self.hAlign = "RIGHT" if role == "user" else "LEFT"
        self._width = 0.0
        self._height = 0.0

        if role == "user":
            self.fill = colors.HexColor("#EDF9F7")
            self.stroke = colors.HexColor("#74CFC5")
            self.accent = CYAN
            self.label_color = CYAN
        elif role == "error":
            self.fill = colors.HexColor("#FFF1F2")
            self.stroke = colors.HexColor("#E9A0A6")
            self.accent = RED
            self.label_color = RED
        else:
            self.fill = colors.HexColor("#F1F6FB")
            self.stroke = colors.HexColor("#A7C7E2")
            self.accent = BLUE
            self.label_color = BLUE

        self.label = Paragraph(
            escaped(label),
            ParagraphStyle(
                f"chat_label_{id(self)}",
                fontName=FONT_BOLD,
                fontSize=7.4,
                leading=9.5,
                textColor=self.label_color,
            ),
        )
        self.body = Paragraph(
            escaped(text),
            ParagraphStyle(
                f"chat_body_{id(self)}",
                fontName=FONT_REGULAR,
                fontSize=8.25,
                leading=12.4,
                textColor=INK,
            ),
        )
        self.source_p = Paragraph(
            escaped(source),
            ParagraphStyle(
                f"chat_source_{id(self)}",
                fontName=FONT_REGULAR,
                fontSize=6.3,
                leading=8,
                textColor=DIM,
            ),
        )

    def wrap(self, avail_width: float, avail_height: float) -> tuple[float, float]:
        self._width = min(self.max_width, avail_width)
        inner_w = self._width - 24
        _, label_h = self.label.wrap(inner_w, avail_height)
        _, body_h = self.body.wrap(inner_w, avail_height)
        _, source_h = self.source_p.wrap(inner_w, avail_height)
        self._label_h = label_h
        self._body_h = body_h
        self._source_h = source_h
        self._height = 11 + label_h + 4 + body_h + 5 + source_h + 10
        return self._width, self._height

    def draw(self) -> None:
        c = self.canv
        c.saveState()
        c.setFillColor(self.fill)
        c.setStrokeColor(self.stroke)
        c.setLineWidth(0.8)
        c.roundRect(0, 0, self._width, self._height, 8, fill=1, stroke=1)
        c.setFillColor(self.accent)
        c.roundRect(0, 0, 4.2, self._height, 2.1, fill=1, stroke=0)
        x = 12
        y = self._height - 10 - self._label_h
        self.label.drawOn(c, x, y)
        y -= 4 + self._body_h
        self.body.drawOn(c, x, y)
        y -= 5 + self._source_h
        self.source_p.drawOn(c, x, y)
        c.restoreState()


class AccentRule(Flowable):
    def __init__(self, color: colors.Color = CYAN, width: float = CONTENT_W) -> None:
        super().__init__()
        self.rule_color = color
        self.rule_width = width

    def wrap(self, avail_width: float, avail_height: float) -> tuple[float, float]:
        return min(self.rule_width, avail_width), 7

    def draw(self) -> None:
        c = self.canv
        c.saveState()
        c.setStrokeColor(self.rule_color)
        c.setLineWidth(1.5)
        c.line(0, 3.5, self.rule_width, 3.5)
        c.setFillColor(self.rule_color)
        c.circle(3, 3.5, 2.8, fill=1, stroke=0)
        c.restoreState()


def card(title: str, body: str, accent: colors.Color = CYAN) -> Table:
    content = [
        Paragraph(escaped(title), STYLES["card_title"]),
        Paragraph(escaped(body), STYLES["card_body"]),
    ]
    table = Table([[content]], colWidths=[CONTENT_W], hAlign="LEFT")
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), PANEL),
                ("BOX", (0, 0), (-1, -1), 0.7, LINE),
                ("LINEBEFORE", (0, 0), (0, -1), 3.5, accent),
                ("LEFTPADDING", (0, 0), (-1, -1), 12),
                ("RIGHTPADDING", (0, 0), (-1, -1), 12),
                ("TOPPADDING", (0, 0), (-1, -1), 9),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 9),
            ]
        )
    )
    return table


def three_cards(items: list[tuple[str, str, colors.Color]]) -> Table:
    width = (CONTENT_W - 12) / 3
    cells = []
    for title, body, accent in items:
        inner = Table(
            [
                [Paragraph(escaped(title), STYLES["card_title"])],
                [Paragraph(escaped(body), STYLES["card_body"])],
            ],
            colWidths=[width - 16],
        )
        inner.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, -1), PANEL),
                    ("LINEABOVE", (0, 0), (-1, 0), 2.5, accent),
                    ("LEFTPADDING", (0, 0), (-1, -1), 8),
                    ("RIGHTPADDING", (0, 0), (-1, -1), 8),
                    ("TOPPADDING", (0, 0), (-1, -1), 7),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
                ]
            )
        )
        cells.append(inner)
    outer = Table([cells], colWidths=[width, width, width], hAlign="LEFT")
    outer.setStyle(
        TableStyle(
            [
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 0),
                ("RIGHTPADDING", (0, 0), (-1, -1), 6),
                ("RIGHTPADDING", (-1, 0), (-1, -1), 0),
            ]
        )
    )
    return outer


def badge(text: str, accent: colors.Color = CYAN) -> Table:
    p = Paragraph(
        escaped(text),
        ParagraphStyle(
            f"badge_{text}",
            fontName=FONT_BOLD,
            fontSize=7.2,
            leading=9,
            textColor=accent,
            alignment=TA_CENTER,
        ),
    )
    t = Table([[p]], hAlign="LEFT")
    t.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), colors.Color(accent.red, accent.green, accent.blue, alpha=0.12)),
                ("BOX", (0, 0), (-1, -1), 0.7, accent),
                ("LEFTPADDING", (0, 0), (-1, -1), 8),
                ("RIGHTPADDING", (0, 0), (-1, -1), 8),
                ("TOPPADDING", (0, 0), (-1, -1), 4),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
            ]
        )
    )
    return t


def page_heading(number: str, title: str, lead: str, accent: colors.Color) -> list:
    return [
        badge(number, accent),
        Spacer(1, 7),
        Paragraph(escaped(title), STYLES["page_title"]),
        Paragraph(escaped(lead), STYLES["page_lead"]),
        AccentRule(accent),
        Spacer(1, 8),
    ]


def chat(
    label: str,
    text: str,
    role: str,
    source: str,
    max_width: float | None = None,
) -> list:
    return [
        ChatBubble(label, text, role, source, max_width=max_width),
        Spacer(1, 7),
    ]


def draw_page(canvas, doc) -> None:
    canvas.saveState()
    canvas.setFillColor(BG)
    canvas.rect(0, 0, PAGE_W, PAGE_H, fill=1, stroke=0)

    if doc.page == 1:
        canvas.setFillColor(colors.HexColor("#EEF7F6"))
        canvas.circle(PAGE_W - 25 * mm, PAGE_H - 28 * mm, 43 * mm, fill=1, stroke=0)
        canvas.setFillColor(colors.HexColor("#F3F0F8"))
        canvas.circle(PAGE_W - 4 * mm, PAGE_H - 11 * mm, 36 * mm, fill=1, stroke=0)
        canvas.setStrokeColor(CYAN)
        canvas.setLineWidth(1.2)
        canvas.line(14 * mm, PAGE_H - 18 * mm, PAGE_W - 14 * mm, PAGE_H - 18 * mm)
        canvas.setFillColor(CYAN)
        canvas.rect(14 * mm, PAGE_H - 19 * mm, 18 * mm, 2 * mm, fill=1, stroke=0)
    else:
        canvas.setStrokeColor(LINE)
        canvas.setLineWidth(0.6)
        canvas.line(14 * mm, PAGE_H - 14 * mm, PAGE_W - 14 * mm, PAGE_H - 14 * mm)
        canvas.setFont(FONT_BOLD, 7)
        canvas.setFillColor(CYAN)
        canvas.drawString(14 * mm, PAGE_H - 11.2 * mm, "PAL-COMF WEBAPP")
        canvas.setFont(FONT_REGULAR, 7)
        canvas.setFillColor(MUTED)
        canvas.drawRightString(
            PAGE_W - 14 * mm,
            PAGE_H - 11.2 * mm,
            "작업 대화 기록",
        )

    canvas.setStrokeColor(LINE)
    canvas.setLineWidth(0.6)
    canvas.line(14 * mm, 12 * mm, PAGE_W - 14 * mm, 12 * mm)
    canvas.setFont(FONT_REGULAR, 6.7)
    canvas.setFillColor(DIM)
    canvas.drawString(14 * mm, 8.5 * mm, "실제 Codex 작업 대화 발췌 - 생략 기준은 2쪽에 명시")
    canvas.drawRightString(PAGE_W - 14 * mm, 8.5 * mm, f"{doc.page:02d}")
    canvas.restoreState()


def cover_story() -> list:
    facts = Table(
        [
            [
                Paragraph("문제", STYLES["card_title"]),
                Paragraph(
                    "정식 버전에서 새 거점 작업 특성과 스킬이 늘었지만 인게임 검색이 없고, 기존 DB는 팰을 하나씩 확인해야 했습니다.",
                    STYLES["card_body"],
                ),
            ],
            [
                Paragraph("자동화", STYLES["card_title"]),
                Paragraph(
                    "원하는 작업 효과나 패시브 키워드 하나로 관련 팰, 파트너 스킬, 특성을 역으로 찾는 로컬 웹 도구를 만들었습니다.",
                    STYLES["card_body"],
                ),
            ],
            [
                Paragraph("이 문서", STYLES["card_title"]),
                Paragraph(
                    "AI의 결과를 그대로 채택하지 않고, 사용자가 의심점을 제기하고 검증 범위를 정한 뒤 게임 데이터와 테스트 결과로 최종 판단한 대화를 선별했습니다.",
                    STYLES["card_body"],
                ),
            ],
        ],
        colWidths=[24 * mm, CONTENT_W - 24 * mm],
        hAlign="LEFT",
    )
    facts.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), PANEL),
                ("BOX", (0, 0), (-1, -1), 0.7, LINE),
                ("INNERGRID", (0, 0), (-1, -1), 0.4, LINE),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 10),
                ("RIGHTPADDING", (0, 0), (-1, -1), 10),
                ("TOPPADDING", (0, 0), (-1, -1), 10),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
            ]
        )
    )
    return [
        Spacer(1, 45 * mm),
        badge("SORTECH PRE-ASSIGNMENT / AI COLLABORATION LOG", CYAN),
        Spacer(1, 10),
        Paragraph("작업<br/>대화 기록", STYLES["title"]),
        Paragraph(
            "Pal-comf WebApp - 팰월드 거점팰 검색기",
            ParagraphStyle(
                "cover_subtitle",
                parent=STYLES["subtitle"],
                fontSize=11.5,
                leading=17,
                textColor=CYAN,
            ),
        ),
        Spacer(1, 8),
        facts,
        Spacer(1, 16),
        Paragraph(
            "수록 기준: 실제 작업 대화만 포함 / 핵심 발화의 의미와 당시 말투 유지 / 검증과 최종 판단이 드러나는 사례 선별",
            STYLES["small"],
        ),
        Spacer(1, 4),
        Paragraph(
            "기록 기간  2026.07.25 - 2026.07.26",
            STYLES["small"],
        ),
        PageBreak(),
    ]


def guide_story() -> list:
    pipeline = Table(
        [
            [
                Paragraph("1. Codex", STYLES["center_bold"]),
                Paragraph("2. repak·CUE4Parse", STYLES["center_bold"]),
                Paragraph("3. Antigravity·React", STYLES["center_bold"]),
                Paragraph("4. Vitest·Playwright", STYLES["center_bold"]),
            ],
            [
                Paragraph("문제와 안전 경계를 나누고 조사·구현 초안 작성", STYLES["center"]),
                Paragraph("pak 선택 추출, 매핑 확인, 5종 샘플 검증", STYLES["center"]),
                Paragraph("프론트 시안을 실제 생성 데이터와 결합", STYLES["center"]),
                Paragraph("회귀 테스트, 브라우저 QA, 영상과 사용자 검수", STYLES["center"]),
            ],
        ],
        colWidths=[CONTENT_W / 4] * 4,
        hAlign="LEFT",
    )
    pipeline.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), CYAN_DARK),
                ("BACKGROUND", (0, 1), (-1, 1), PANEL),
                ("BOX", (0, 0), (-1, -1), 0.7, CYAN),
                ("INNERGRID", (0, 0), (-1, -1), 0.5, LINE),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("TOPPADDING", (0, 0), (-1, -1), 8),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
                ("LEFTPADDING", (0, 0), (-1, -1), 6),
                ("RIGHTPADDING", (0, 0), (-1, -1), 6),
            ]
        )
    )

    tools = Table(
        [
            [
                Paragraph("도구 구분", STYLES["card_title"]),
                Paragraph("사용 범위", STYLES["card_title"]),
            ],
            [
                Paragraph("AI - OpenAI Codex Desktop", STYLES["card_body"]),
                Paragraph(
                    "게임 데이터 조사, C# 추출기와 웹 UI 구현, 테스트, 브라우저 QA, 문서와 실행 영상 제작",
                    STYLES["card_body"],
                ),
            ],
            [
                Paragraph("AI - Google Antigravity", STYLES["card_body"]),
                Paragraph(
                    "초기 프론트엔드 시안과 색상, 카드 레이아웃 탐색",
                    STYLES["card_body"],
                ),
            ],
            [
                Paragraph("실행·검증 도구", STYLES["card_body"]),
                Paragraph(
                    "CUE4Parse, repak, Vitest, Playwright, 실제 브라우저 DOM 및 콘솔 검사 - AI가 아니라 결과를 검증하는 실행 도구",
                    STYLES["card_body"],
                ),
            ],
        ],
        colWidths=[44 * mm, CONTENT_W - 44 * mm],
        hAlign="LEFT",
    )
    tools.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), PANEL_2),
                ("BACKGROUND", (0, 1), (-1, -1), PANEL),
                ("BOX", (0, 0), (-1, -1), 0.7, LINE),
                ("INNERGRID", (0, 0), (-1, -1), 0.4, LINE),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 9),
                ("RIGHTPADDING", (0, 0), (-1, -1), 9),
                ("TOPPADDING", (0, 0), (-1, -1), 8),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
            ]
        )
    )

    case_rows = [
        ("01", "패시브 색상", "분류 결과를 게임 위젯 기준으로 직접 재검증"),
        ("02", "검색 필터", "검색 노출 오류를 전체 효과 기준으로 교정"),
        ("03", "게임 UI 자산", "아이콘 선택을 실제 위젯 참조 기준으로 재확인"),
        ("04", "확률 해석", "원본 값 10의 해석 범위와 미확인 영역 분리"),
        ("05", "작업 절차", "공개 전 사용자 검수 절차를 작업 흐름에 반영"),
    ]
    index = Table(
        [
            [
                Paragraph("CASE", STYLES["card_title"]),
                Paragraph("구분", STYLES["card_title"]),
                Paragraph("검증 포인트", STYLES["card_title"]),
            ]
        ]
        + [
            [
                Paragraph(num, STYLES["card_body"]),
                Paragraph(kind, STYLES["card_body"]),
                Paragraph(desc, STYLES["card_body"]),
            ]
            for num, kind, desc in case_rows
        ],
        colWidths=[17 * mm, 36 * mm, CONTENT_W - 53 * mm],
        hAlign="LEFT",
    )
    index.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), PANEL_2),
                ("BACKGROUND", (0, 1), (-1, -1), PANEL),
                ("BOX", (0, 0), (-1, -1), 0.7, LINE),
                ("INNERGRID", (0, 0), (-1, -1), 0.35, LINE),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 8),
                ("RIGHTPADDING", (0, 0), (-1, -1), 8),
                ("TOPPADDING", (0, 0), (-1, -1), 7),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
            ]
        )
    )

    return [
        *page_heading(
            "WORKFLOW OVERVIEW",
            "AI와 함께 작업한 과정",
            "AI의 제안과 결과물을 어떻게 검토하고, 어떤 근거를 확인한 뒤 최종 판단했는지 실제 사례로 정리했습니다.",
            CYAN,
        ),
        Paragraph("실제 도구 사용 순서", STYLES["section"]),
        pipeline,
        Spacer(1, 12),
        Paragraph("사용 도구", STYLES["section"]),
        tools,
        Spacer(1, 12),
        Paragraph("기록한 주요 사례", STYLES["section"]),
        index,
        Spacer(1, 10),
        card(
            "발췌 기준",
            "아래 대화 상자는 실제 Codex 작업 대화에서 핵심 발화를 옮긴 기록입니다. 읽기 흐름에 영향을 주지 않는 브라우저 자동 컨텍스트, 반복 진행 보고와 장문의 도구 출력은 생략했습니다. 발화의 핵심 의미와 당시 말투는 유지하고 줄바꿈과 일부 문장부호만 읽기 쉽게 정리했으며, 생략된 부분은 `…`로 표시했습니다. 관련 검증 과정과 수정 결과는 공개 저장소의 AI 작업 기록과 회고에 별도로 정리했습니다.",
            PURPLE,
        ),
        PageBreak(),
    ]


def case_one_story() -> list:
    story = page_heading(
        "CASE 01 / DATA INTERPRETATION",
        "패시브 색상 결과를 직접 재검증",
        "AI의 최초 분류를 그대로 채택하지 않고 실제 게임 경험과 화면을 대조해 오분류 가능성을 발견했습니다. 이후 원본 위젯 분기와 전체 카드 검증을 요구해 최종 기준을 확정했습니다.",
        YELLOW,
    )
    story += chat(
        "AI - 최초 분류 제안",
        "분류 규칙도 잡힘. 현재 1.0 구조화 필드 기준으로 `일반 = 기본 풀`, `노란 = Rank 4/희귀`, `파란 = AddMutationPal`, `세계수 = AddWorldTreePal`임. … 뇌피셜 색칠 아니고 pak의 행 플래그+WBP 애니메이션 둘 다 맞춘 상태임.",
        "error",
        "실제 작업 대화 발췌",
    )
    story += chat(
        "사용자 - 결과물 직접 대조",
        "그리고 초절기교는 파란색 아니였나? 장인기질은 노란색이였고. 뭔가 이상한데 패시브들.",
        "user",
        "실제 작업 대화 발췌",
        max_width=CONTENT_W * 0.78,
    )
    story += chat(
        "사용자 - 검증 범위 결정",
        "인게임 데이터에 각 패시브별 색상등이 있지 않음? 전부 확인해서 매칭시켜.",
        "user",
        "동일 작업 대화의 후속 발화",
        max_width=CONTENT_W * 0.73,
    )
    story += chat(
        "AI - 원본 재검증 결과",
        "원인 잡힘. 인게임 위젯은 `AddRarePal` 같은 플래그가 아니라 `Rank`로 바탕 애니메이션을 고름. `장인 기질=Rank 3 노랑`, `초절기교=Rank 4 파랑`이 맞고, 화살표도 랭크별 텍스처가 따로라 9개 전부 그 규칙으로 갈아엎는 중임.",
        "ai",
        "실제 작업 대화 발췌",
    )
    story += [
        Spacer(1, 2),
        three_cards(
            [
                (
                    "발견한 불일치",
                    "초기 분류는 DataTable 플래그와 애니메이션 이름을 기준으로 했고, 실제 SetPassiveSkill 분기와 결과가 일치하는지 추가 확인이 필요한 상태였습니다.",
                    RED,
                ),
                (
                    "최종 판단을 위한 검증",
                    "현재 설치본 WBP의 소비 로직을 확인하도록 요구하고, Rank 0~5 분기와 등급별 화살표 선택을 대조했습니다.",
                    BLUE,
                ),
                (
                    "검증 결과",
                    "특성 9개를 전수 매칭하고 브라우저 카드 9개, 테스트 14개, lint, typecheck, 두 빌드를 통과했습니다.",
                    GREEN,
                ),
            ]
        ),
        Spacer(1, 9),
        card(
            "내가 적용한 판단 기준",
            "AI의 답은 구현 초안으로 활용하되 최종 판단은 실제 게임 화면, 원본 위젯 분기, 전체 카드와 테스트 결과를 확인한 뒤 내렸습니다.",
            YELLOW,
        ),
        PageBreak(),
    ]
    return story


def case_two_story() -> list:
    story = page_heading(
        "CASE 02 / SEARCH LOGIC",
        "세크메트가 파종·채집 검색에 노출",
        "파종·채집 필터에서 대상 팰 한정 효과가 함께 노출되는 상황이 발생했습니다. null 의미와 대상 팰의 작업 적성을 다시 확인하고 전체 효과 기준으로 적용 범위를 구조화했습니다.",
        ORANGE,
    )
    story += chat(
        "사용자 - 예상과 다른 결과 확인",
        "디자인 좋은듯함. 근데 기능면에서 이상한점이있는데 채집, 파종 선택했을때 세크메트가 왜 나옴.",
        "user",
        "실제 작업 대화 발췌",
        max_width=CONTENT_W * 0.83,
    )
    story += chat(
        "AI - 원인 분석",
        "원인 잡힘. 세크메트 데이터가 틀린 게 아니라 필터가 `작업 종류가 null인 전체 작업 속도 효과`를 모든 작업에 무조건 포함시키는 조건이라 새는 거임. 세크메트의 그 효과는 실제론 아누비스 전용인데, UI가 대상 팰 작업 적성까지 안 보고 있음.",
        "ai",
        "실제 작업 대화 발췌",
    )
    story += chat(
        "사용자 - 대응 범위 결정",
        "세크메트뿐만 아니라 전체적으로 검수하고 패치해.",
        "user",
        "실제 작업 대화 발췌",
        max_width=CONTENT_W * 0.66,
    )
    story += chat(
        "AI - 전체 데이터 확인 결과",
        "26개 중 `workSuitabilityId=null`은 8개인데, 7개는 진짜 전 작업 특성이고 세크메트 1개만 아누비스 한정임. null 하나로 둘을 뭉갠 게 버그라 추출 데이터부터 작업 적용 범위를 명시하는 식으로 고치는 중임.",
        "ai",
        "실제 작업 대화 발췌",
    )
    story += [
        three_cards(
            [
                (
                    "발생한 상황",
                    "원본 필드에 특정 작업이 없는 효과가 전 작업 대상으로 처리되면서, 대상 팰 한정 효과까지 파종·채집 결과에 포함됐습니다.",
                    RED,
                ),
                (
                    "대응 방법",
                    "대상인 아누비스의 설치본 작업 적성을 읽어 효과별 applicableWorkSuitabilityIds를 추출 단계에서 계산했습니다.",
                    BLUE,
                ),
                (
                    "검증 결과",
                    "효과 26개와 작업 필터 12종 전수 검사. 파종·채집에서 세크메트 0개, 수작업·채굴·운반에만 유지했습니다.",
                    GREEN,
                ),
            ]
        ),
        Spacer(1, 9),
        card(
            "적용한 해결 기준",
            "한 개 ID만 숨기는 예외 처리는 사용하지 않고, 같은 구조의 새 데이터가 추가돼도 유지되는 명시적 적용 작업 배열로 수정했습니다.",
            ORANGE,
        ),
        PageBreak(),
    ]
    return story


def case_three_story() -> list:
    story = page_heading(
        "CASE 03 / ASSET SELECTION",
        "작업 아이콘 표시 차이를 원본 자산으로 해결",
        "웹 화면의 아이콘이 작고 인게임 색상과 다르게 보이는 상황이 발생했습니다. 초기 자산 선택을 다시 확인하고 실제 위젯이 참조하는 컬러 아이콘으로 교체했습니다.",
        BLUE,
    )
    story += chat(
        "AI - 초기 자산 선택 결과",
        "작업 아이콘은 이미 정답 경로 나옴. `T_icon_skill_pal_WorkRank_Watering`, `..._Seeding`처럼 12종이 이름까지 박혀 있어서 추측 매핑 필요 없음.",
        "error",
        "실제 작업 대화 발췌",
    )
    story += chat(
        "사용자 - 화면 차이 확인",
        "뭔가 살짝 패시브 UI가 이상한데? 그리고 작업 아이콘 너무 작으니까 크기를 키워주고 색도 인게임처럼 넣어줘.",
        "user",
        "실제 작업 대화 발췌",
        max_width=CONTENT_W * 0.82,
    )
    story += chat(
        "AI - 원본 위젯 확인 결과",
        "팩트 찾음. 지금 쓴 `WorkRank_*`는 흰색 마스크라서 CSS로 색을 추측해야 하는 자산이고, 실제 인게임 위젯 `WBP_IconPalWork`는 별도 컬러 아이콘 `T_icon_palwork_00~12`를 40×40으로 표시함. 즉 색 입히는 게 아니라 애초에 자산 선택이 한 단계 틀렸음.",
        "ai",
        "실제 작업 대화 발췌",
    )
    story += chat(
        "AI - 테스트에서 확인한 예외",
        "테스트가 하나 제대로 잡아냄. 컬러 아이콘 13개는 맞는데 전부 64×64라는 내 가정이 하나 이상 틀림. … 테스트가 원유 추출만 40×40인 예외까지 잡아냈고 문서·테스트를 실제 값으로 바로잡음.",
        "ai",
        "동일 작업 대화의 후속 발화",
    )
    story += [
        three_cards(
            [
                (
                    "발생한 상황",
                    "파일명과 구조 ID가 일치하는 흰 마스크를 사용했지만, 실제 화면 위젯은 별도의 컬러 아이콘을 참조하고 있었습니다.",
                    RED,
                ),
                (
                    "대응 방법",
                    "WBP_IconPalWork.IconMap과 Brush 크기를 읽어 실제 컬러 T_icon_palwork 자산 13종을 선택 추출했습니다.",
                    BLUE,
                ),
                (
                    "검증 결과",
                    "원본 Texture2D 해상도는 일반 작업 12종 64×64, 원유 추출 40×40로 확인했습니다. 위젯 표시 크기와 원본 해상도를 구분해 기록하고 테스트 7개와 두 빌드, 콘솔 검사를 통과했습니다.",
                    GREEN,
                ),
            ]
        ),
        Spacer(1, 9),
        card(
            "적용한 해결 기준",
            "자산의 이름보다 실제 게임 위젯의 참조 관계와 표시 크기를 우선합니다. 테스트가 새 가정을 깨면 기대값을 낮추지 않고 원본을 다시 확인합니다.",
            BLUE,
        ),
        PageBreak(),
    ]
    return story


def case_four_story() -> list:
    story = page_heading(
        "CASE 04 / UNCERTAINTY",
        "불길한 알 확률 표기의 근거 범위 재확인",
        "설치본에서 값 10은 확인됐지만 어떤 확률로 표현해야 하는지 추가 검증이 필요한 상황이었습니다. 원본 필드와 내용물 가중치를 분리하고, 확인되지 않은 소비 로직은 UI에서 단정하지 않았습니다.",
        PURPLE,
    )
    story += chat(
        "AI - 초기 해석",
        "`WorldTreePalEggProbability = 10`이라 불길한 알 확률은 10%로 해석됨.",
        "error",
        "실제 작업 대화 발췌",
        max_width=CONTENT_W * 0.73,
    )
    story += chat(
        "사용자 - 단위 재확인",
        "불길한알 확률은 10%임?",
        "user",
        "실제 작업 대화 발췌",
        max_width=CONTENT_W * 0.42,
    )
    story += chat(
        "AI - 필드 의미 재확인",
        "ㄴㄴ 지금 데이터에 `10`이 들어있는 건 맞는데, 그 숫자를 곧바로 `10%`라고 부르면 뇌피셜임. 실제 필드명과 추첨 로직에서 분모·가중치 사용법까지 다시 확인해서 퍼센트인지 가중치인지 딱 잘라봄.",
        "ai",
        "실제 작업 대화 발췌",
    )
    story += chat(
        "AI - 확인 범위 정리",
        "`10`은 알에서 어떤 팰이 나올지 정하는 가중치와 별도 필드임. … 엄밀히는 네이티브 C++ 소비 로직까지 없어서 UI에는 안전하게 `원본 추첨값 10`으로 표시해둔 상태임.",
        "ai",
        "동일 작업 대화의 후속 발화",
    )
    story += [
        three_cards(
            [
                (
                    "확인된 사실",
                    "bIsWorldTreePalEgg=true, 원본 필드값 10, 재생성 및 추첨 쿨타임 180분은 설치본에서 직접 확인했습니다.",
                    GREEN,
                ),
                (
                    "확인되지 않은 부분",
                    "네이티브 소비 코드가 없어 값 10의 정확한 분모와 보정 규칙을 구조화 자산만으로 완전히 증명하지 못했습니다.",
                    ORANGE,
                ),
                (
                    "표현 수정",
                    "특정 팰의 등장 확률과 스포너의 알 종류 추첨을 분리하고, 웹 UI에는 해석 대신 원본 추첨값을 표시했습니다.",
                    BLUE,
                ),
            ]
        ),
        Spacer(1, 9),
        card(
            "적용한 표현 기준",
            "숫자를 발견한 것과 그 숫자의 단위를 증명한 것은 별개입니다. 확실한 원본 값, 합리적 해석, 미확인 영역을 문구에서 분리합니다.",
            PURPLE,
        ),
        PageBreak(),
    ]
    return story


def case_five_story() -> list:
    story = page_heading(
        "CASE 05 / APPROVAL CONTROL",
        "공개 전 로컬 검수 절차를 추가",
        "실행 영상을 만든 뒤 사용자 검수 전에 공개 저장소까지 갱신되는 상황이 발생했습니다. 이후 공개 단계를 분리하고, 로컬 수정본 승인 뒤에만 최종 문서와 저장소를 갱신했습니다.",
        RED,
    )
    story += chat(
        "AI - 초기 공개 진행 결과",
        "ㅇㅇ 원하는 의도로 영상 다시 뽑고 GitHub `main`까지 갱신했음. … 32.04초, 1440×900, 3.08MB. … 커밋: `6de1360 docs: simplify assignment demo video`.",
        "error",
        "실제 작업 대화 발췌",
    )
    story += chat(
        "사용자 - 작업 순서 재설정",
        "일단 로컬에서 영상 보여주고 검수받고 올려야지.",
        "user",
        "실제 작업 대화 발췌",
        max_width=CONTENT_W * 0.61,
    )
    story += chat(
        "AI - 작업 절차 변경",
        "맞음. 내가 순서 거꾸로 밟았음. 현재 영상은 이미 GitHub에 올라간 상태고, 원격 기록은 네 지시 없이 안 건드림. 이후부터는 `로컬 영상 생성 → 네 검수·승인 → GitHub 푸시` 순서로 고정함.",
        "ai",
        "실제 작업 대화 발췌",
    )
    story += chat(
        "사용자 - 수정본 최종 승인",
        "영상은 괜찮네.",
        "user",
        "46.04초 로컬 수정본 확인 뒤의 후속 발화",
        max_width=CONTENT_W * 0.35,
    )
    story += [
        three_cards(
            [
                (
                    "발생한 상황",
                    "영상 생성과 공개가 한 단계로 진행되면서 첫 영상이 로컬 검수 전에 공개 저장소에 반영됐습니다.",
                    RED,
                ),
                (
                    "대응 방법",
                    "이후 자막 말투, 노출 시간, 대비, 문구를 로컬에서 반복 수정하고 승인 전에는 스테이징·커밋·푸시를 중단했습니다.",
                    BLUE,
                ),
                (
                    "검증 결과",
                    "최종본 46.04초와 주요 8개 프레임을 검수하고, 사용자가 최종본을 승인한 뒤 문서와 저장소를 갱신했습니다.",
                    GREEN,
                ),
            ]
        ),
        Spacer(1, 9),
        card(
            "적용한 공개 기준",
            "되돌리기 어려운 외부 공개는 '생성 완료'와 '사용자 승인 완료'를 분리합니다. 앞으로 모든 제출 자산은 로컬 검수 게이트를 통과한 뒤 공개합니다.",
            RED,
        ),
        PageBreak(),
    ]
    return story


def closing_story() -> list:
    pattern_table = Table(
        [
            [
                Paragraph("검증 포인트", STYLES["card_title"]),
                Paragraph("작업 중 발생한 상황", STYLES["card_title"]),
                Paragraph("내가 적용한 판단 기준", STYLES["card_title"]),
            ],
            [
                Paragraph("기준 조기 확정", STYLES["card_body"]),
                Paragraph("파일명, 플래그와 원본 값만으로 표시 기준을 먼저 정함", STYLES["card_body"]),
                Paragraph("소비 로직과 실제 렌더까지 확인", STYLES["card_body"]),
            ],
            [
                Paragraph("필드 의미 중첩", STYLES["card_body"]),
                Paragraph("null, 플래그와 숫자 하나에 여러 의미가 함께 들어감", STYLES["card_body"]),
                Paragraph("원본 값과 파생 의미를 별도 필드로 보존", STYLES["card_body"]),
            ],
            [
                Paragraph("부분 수정 범위", STYLES["card_body"]),
                Paragraph("한 카드나 한 ID만 처리하면 같은 구조가 남을 수 있음", STYLES["card_body"]),
                Paragraph("전체 효과와 전체 필터 전수 검사", STYLES["card_body"]),
            ],
            [
                Paragraph("승인 단계 미분리", STYLES["card_body"]),
                Paragraph("완성과 공개가 같은 단계로 진행됨", STYLES["card_body"]),
                Paragraph("로컬 생성 - 사용자 승인 - 외부 공개 게이트", STYLES["card_body"]),
            ],
        ],
        colWidths=[34 * mm, 64 * mm, CONTENT_W - 98 * mm],
        hAlign="LEFT",
    )
    pattern_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), PANEL_2),
                ("BACKGROUND", (0, 1), (-1, -1), PANEL),
                ("BOX", (0, 0), (-1, -1), 0.7, LINE),
                ("INNERGRID", (0, 0), (-1, -1), 0.4, LINE),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 8),
                ("RIGHTPADDING", (0, 0), (-1, -1), 8),
                ("TOPPADDING", (0, 0), (-1, -1), 8),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
            ]
        )
    )
    return [
        *page_heading(
            "RETROSPECTIVE",
            "AI를 활용하고 최종 판단한 방식",
            "AI가 만든 초안을 빠르게 활용하되 결과가 사용자 경험과 원본 데이터에 맞는지는 직접 검증하고 최종 판단했습니다.",
            GREEN,
        ),
        Paragraph("작업 중 확인한 검증 포인트", STYLES["section"]),
        pattern_table,
        Spacer(1, 12),
        Paragraph("내가 최종 판단을 내린 방식", STYLES["section"]),
        three_cards(
            [
                (
                    "1. 결과물을 직접 대조",
                    "게임 기억과 화면이 다르면 '왜 나오는지', '원본 데이터가 있는지'를 다시 물어 AI의 전제를 검증했습니다.",
                    CYAN,
                ),
                (
                    "2. 부분 수정 대신 전수 검사 결정",
                    "세크메트 한 건이나 패시브 두 개만 고치지 말고 효과 26개, 필터 12종, 카드 9개를 전부 대조하게 했습니다.",
                    BLUE,
                ),
                (
                    "3. 검증 완료 조건 설정",
                    "원본 자산 경로, 추출 무결성, 테스트, 빌드, 브라우저 DOM과 콘솔, 사용자 승인을 완료 조건으로 뒀습니다.",
                    GREEN,
                ),
            ]
        ),
        Spacer(1, 12),
        Paragraph("다시 한다면", STYLES["section"]),
        card(
            "초기 설계 단계에서 먼저 고정할 것",
            "첫째, DataTable 필드보다 실제 소비 함수와 위젯 분기를 우선하는 출처 계층을 정합니다. 둘째, null 의미, Rank 색상, 자산 크기 같은 불변식 테스트를 구현 전에 작성합니다. 셋째, GitHub 푸시와 제출처럼 외부 상태를 바꾸는 작업은 명시적 승인 게이트를 체크리스트에 넣습니다.",
            GREEN,
        ),
        Spacer(1, 10),
        card(
            "결론",
            "이번 기록은 AI 결과를 그대로 받아 적은 과정이 아닙니다. 실제 구현 중 나온 데이터 해석 오류, 검색 로직 오류, 자산 선택 오류, 불확실성 표현 오류와 공개 절차 문제를 직접 발견하고 재검증 범위를 정해 최종 판단한 과정입니다.",
            CYAN,
        ),
        Spacer(1, 10),
        Paragraph(
            "자료: 본 문서의 실제 대화 발췌 / 공개 저장소 docs/AI_WORKLOG.md / docs/RETROSPECTIVE.md<br/>프로젝트: https://github.com/r2gul4r/Pal-comf_WebApp",
            STYLES["small"],
        ),
    ]


def build_pdf() -> None:
    register_fonts()
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)

    doc = SimpleDocTemplate(
        str(OUTPUT_PATH),
        pagesize=A4,
        leftMargin=14 * mm,
        rightMargin=14 * mm,
        topMargin=19 * mm,
        bottomMargin=17 * mm,
        title="Pal-comf WebApp - 작업 대화 기록",
        author="Pal-comf WebApp project",
        subject="소르테크 사전 과제 AI 활용 기록",
        creator="OpenAI Codex Desktop + ReportLab",
    )

    story = []
    story += cover_story()
    story += guide_story()
    story += case_one_story()
    story += case_two_story()
    story += case_three_story()
    story += case_four_story()
    story += case_five_story()
    story += closing_story()

    doc.build(story, onFirstPage=draw_page, onLaterPages=draw_page)
    print(f"created: {OUTPUT_PATH}")


if __name__ == "__main__":
    build_pdf()
