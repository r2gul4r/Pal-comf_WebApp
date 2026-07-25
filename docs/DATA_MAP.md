# Palworld 1.0 데이터 맵

이 문서는 설치된 Steam 빌드에서 직접 확인한 자산 경로와 검증 상태를 기록한다.
예전 버전 문서의 경로는 현재 pak 인덱스에서 다시 확인되기 전까지 근거로 사용하지 않는다.

## 기준 설치본

| 항목 | 확인값 |
| --- | --- |
| Steam App ID | `1623730` |
| Steam Build ID | `24181527` |
| Steam 언어 | `koreana` |
| pak 파일 | `Pal/Content/Paks/Pal-Windows.pak` |
| pak 크기 | `40,526,106,335` bytes |
| pak 엔트리 | `185,003` |
| pak 버전 | `V11 (Fnv64BugFix)` |
| 인덱스 암호화 | 없음 |
| 압축 | Oodle |
| Unreal Engine | `5.1.1` |

확인일: 2026-07-25

## 인덱스에서 확인한 핵심 자산

| 용도 | pak 내부 경로 | 상태 |
| --- | --- | --- |
| 팰 기본 파라미터 | `Pal/Content/Pal/DataTable/Character/DT_PalMonsterParameter.uasset` | 753행 직렬화 확인 |
| 팰 아이콘 매핑 | `Pal/Content/Pal/DataTable/Character/DT_PalCharacterIconDataTable.uasset` | 행 직렬화·PNG 변환 확인 |
| 파트너 스킬 정의 | `Pal/Content/Pal/DataTable/PartnerSkill/DT_PartnerSkill.uasset` | 인덱스·선택 추출 확인 |
| 파트너 스킬 파라미터 | `Pal/Content/Pal/DataTable/PassiveSkill/DT_PartnerSkillParameter.uasset` | 인덱스·선택 추출 확인 |
| 패시브 특성 | `Pal/Content/Pal/DataTable/PassiveSkill/DT_PassiveSkill_Main.uasset` | 인덱스·선택 추출 확인 |
| 파트너 스킬 추가 문구 | `Pal/Content/Pal/DataTable/Text/DT_PartnerSkillAppendText.uasset` | 인덱스·선택 추출 확인 |
| 한국어 파트너 스킬 추가 문구 | `Pal/Content/L10N/ko/Pal/DataTable/Text/DT_PartnerSkillAppendText.uasset` | 인덱스·선택 추출 확인 |
| 한국어 팰 이름 | `Pal/Content/L10N/ko/Pal/DataTable/Text/DT_PalNameText_Common.uasset` | 322행 직렬화·키 결합 확인 |
| 한국어 스킬 이름 | `Pal/Content/L10N/ko/Pal/DataTable/Text/DT_SkillNameText_Common.uasset` | 파트너 스킬명·특성명 결합 확인 |
| 한국어 특성 설명 | `Pal/Content/L10N/ko/Pal/DataTable/Text/DT_SkillDescText_Common.uasset` | 설명 오버라이드 결합 확인 |
| 한국어 파트너 스킬 설명 | `Pal/Content/L10N/ko/Pal/DataTable/Text/DT_PalFirstActivatedInfoText.uasset` | 305행 직렬화·효과 문구 결합 확인 |
| 한국어 작업 적성명 | `Pal/Content/L10N/ko/Pal/DataTable/Text/DT_UI_Common_Text_Common.uasset` | `COMMON_WORK_SUITABILITY_*` 19행 확인 |
| 한국어 locres | `Pal/Content/Localization/Game/ko/Game.locres` | 37 bytes, 주 데이터가 아님 |
| 패시브 표시 위젯 | `Pal/Content/Pal/Blueprint/UI/UserInterface/MainMenu/Pal/WBP_MainMenu_Pal_Skill_Passive.uasset` | 570 exports 직렬화·애니메이션 트랙 확인 |
| 작업 적성 아이콘 매핑 | `Pal/Content/Pal/Blueprint/UI/UserInterface/InGame/EnemyGauge/WBP_IconPalWork.uasset` | `IconMap`의 작업 enum·컬러 Texture2D 연결 확인 |
| 컬러 작업 적성 아이콘 | `Pal/Content/Pal/Texture/UI/InGame/T_icon_palwork_*.uasset` | 일반 작업 12종 64×64, 원유 추출 40×40 PNG 확인 |

각 `uasset`에는 같은 경로의 `uexp`가 존재한다. 패키지를 읽을 때 두 파일을 한 쌍으로 취급한다.

## 인게임 UI 자산 검증

`WBP_IconPalWork`의 `Default__WBP_IconPalWork_C.IconMap`을 읽어 작업 enum을
`T_icon_palwork_00`~`12`에 결합한다. `EmitFlame`, `Watering`, `Seeding`,
`GenerateElectricity`, `Handcraft`, `Collection`, `Deforest`, `Mining`,
`OilExtraction`, `ProductMedicine`, `Cool`, `Transport`, `MonsterFarm` 13종을
컬러 PNG로 선택 디코딩했다. 일반 작업 12종은 64×64이고 원유 추출은
40×40이며, 위젯 Brush 표시 크기는 40×40이다.
`Anyone`용 `T_icon_palwork_13`은 작업 적성이 아니므로 생성 목록에서 제외한다.

패시브 위젯과 세계수 전용 머티리얼이 참조하는 아래 Texture2D 15종을
선택 디코딩했다.

| 생성 키 | pak 내부 자산 |
| --- | --- |
| `frame` | `Pal/Content/Pal/Texture/UI/Main_Menu/T_prt_pal_skill_base_00` |
| `frameOverlay` | `Pal/Content/Pal/Texture/UI/Main_Menu/T_prt_pal_skill_base_01` |
| `prismBand` | `Pal/Content/Pal/Texture/UI/Main_Menu/T_prt_pal_skill_base_02` |
| `prismTriangle` | `Pal/Content/Pal/Texture/UI/Main_Menu/T_prt_menu_pal_base_tri` |
| `backgroundGradient` | `Pal/Content/Pal/Texture/UI/Main_Menu/T_prt_menu_bggrd` |
| `rankArrow0`~`rankArrow5` | `Pal/Content/Pal/Texture/UI/Main_Menu/T_icon_skillstatus_rank_arrow_00`~`05` |
| `worldTreeDissolve` | `Pal/Content/Pal/Material/UI/Texture/T_UI_BossBattle_RG` |
| `worldTreeDissolveTarget` | `Pal/Content/Pal/Texture/UI/Common/T_prt_BGParticle_Mask_0` |
| `worldTreeScroll` | `Pal/Content/Pal/Texture/UI/InGame/T_prt_gameover_uvscroll_0` |
| `worldTreeScrollMask` | `Pal/Content/Pal/Texture/UI/InGame/T_prt_gameover_mask_0` |

세계수의 `Overlay_CurseEff`는 단일 마스크가 아니었다. 위젯 Brush를 따라가면
아래 네 머티리얼 레이어가 나온다.

| 레이어 | WBP 위젯 | 머티리얼 | WBP Brush alpha |
| --- | --- | --- | ---: |
| 디졸브 | `SkillBase_Eff_Curse` | `MI_UI_Dissolve_0_PalPassiveSkill` | 0.5 |
| 느린 스크롤 | `SkillBase_Eff_Curse_1` | `MI_UI_GameOver_Scroll_2` | 1.0 |
| 빠른 스크롤 | `SkillBase_Eff_Curse_2` | `MI_UI_GameOver_Scroll_3` | 1.0 |
| 기본 그라데이션 | `SkillBase_Eff_Curse_3` | `MI_UI_BaseGrd_2` | 0.3 |

`WBP_MainMenu_Pal_Skill_Passive`의 `SetPassiveSkill` 바이트코드 분기와
MovieScene 색·불투명도 트랙을 함께 읽어 아래 표시 규칙을 생성 메타데이터로
만든다.

| 웹 스타일 | 게임 애니메이션 | `Rank` 분기 | MVP 샘플 |
| --- | --- | --- | --- |
| 일반 | `Anm_Buff_Normal` | 0~1 | 성실함 |
| 노란 | `Anm_Rare_Normal` | 2~3 | 장인 기질, 목장 아이 |
| 파란 | `Anm_Rare2_Normal` | 4 | 초절기교, 희귀, 목장 주인 |
| 세계수 | `Anm_Rare3_Normal` | 5 | 악마의 손 |

음수 Rank는 `Anm_Debuff_Normal`을 사용하고 화살표를 180도 돌린다. Rank 0은
`T_icon_skillstatus_rank_arrow_00`을 지정한 뒤 화살표 위젯을 숨기며, 양수
Rank 1~5는 번호가 같은 `_01`~`_05` Texture2D를 사용한다.
`AddRarePal`, `AddMutationPal`, `AddWorldTreePal`은 특성 획득 가능 풀을 나타낼
뿐 바탕색을 선택하지 않는다. 이전 플래그 기반 분류는 실제 위젯 분기와
충돌해 폐기했다.

세계수형은
`Overlay_CurseEff`가 1이고 파란형은 프리즘·효과 레이어가 1인 것도 확인했다.
Unreal UMG와 동적 머티리얼을 브라우저에서 직접 실행할 수 없으므로 웹에서는
실제 Texture2D 레이어와 WBP 색을 사용하되 세계수 보라색 효과는 사용자
확인에 따라 저농도로 표현한다. `SkillBase`의
좌우 0.5 Box margin, 배경 inset, 252×27 프리즘 패턴, 24×24 등급 화살표를
웹 레이아웃에도 반영하며 게임에 없는 `RANK n` 텍스트는 표시하지 않는다.

## 현지화 판단

- 현재 빌드의 `Pal/Content/Localization/Game/ko/Game.locres`는 선택 추출 결과가 37 bytes다.
- 실제 한국어 팰 이름, 스킬 이름·설명과 UI 작업 적성명은 `Pal/Content/L10N/ko/...` 아래 DataTable 오버라이드에서 직렬화됐다.
- `PAL_NAME_{PalId}`, `PARTNERSKILL_{PalId}`, `PAL_FIRST_SPAWN_DESC_{PalId}`와 `COMMON_WORK_SUITABILITY_{WorkId}` 키 결합을 5종 샘플에서 확인했다.
- 따라서 이 빌드의 MVP 현지화는 `locres` 파싱이 아니라 한국어 DataTable 결합을 사용한다.

## 도구 호환성

- `repak 0.2.3`으로 V11 pak 인덱스를 읽었다.
- 인덱스 확인은 매핑 파일 없이 성공했다.
- Oodle 압축 자산 선택 추출은 `oo2core_9_win64.dll`이 필요했다.
- 사용한 Oodle DLL SHA-256:
  `6F5D41A7892EA6B2DB420F2458DAD2F84A63901C9A93CE9497337B16C195F457`
- CUE4Parse `1.2.2.202607`로 pak 마운트까지 성공했다.
- `DT_PalMonsterParameter`는 unversioned property를 사용해 매핑 없이 직렬화할 수 없었다.
- Nexus Mods `Mapping101`을 로그인 세션으로 다운로드해 현재 설치본과 대조했다.
  - 표시 버전: `1.0.1`
  - 업로드: `2026-07-18`
  - Nexus 파일 ID: `17203`
  - 다운로드 ZIP SHA-256: `AD7A6C19D9A15D75E8FA367DB8B453AEC2A5705323EFFC44429E655AB2B27D15`
  - `Mappings101.usmap` SHA-256: `B9B1EF0A5B2FBA657D421F43C31DDA7D3818AADB50E52C1C3215DFE45DB9FB44`
  - ZIP 해시는 Nexus가 연결한 VirusTotal 해시와 일치했다.
- 이 매핑으로 현재 Build ID `24181527`의 `DT_PalMonsterParameter` 753행을 직렬화했다.
- 한국어 DataTable, 파트너 스킬 파라미터, 패시브 효과와 아이콘 텍스처도 같은 provider에서 읽혔다.
- 판정: 현재 설치본의 샘플 추출 범위에서 매핑 호환 확인.

## 5종 샘플 결과

| 팰 ID | 한국어 이름 | 파트너 스킬 | 정규화한 거점 효과 | 기본 작업 적성 | 아이콘 |
| --- | --- | --- | --- | --- | --- |
| `PinkRabbit` | 핑토 | 항상 웃는 공주 토끼 | 다른 거점 팰 수작업 `+1` | 수작업 1, 채집 1, 운반 1 | 128×128 PNG 확인 |
| `CatMage_Fire` | 캐티위자드 | 정열적 암흑술 | 다른 거점 팰 불 피우기 `+1` | 불 피우기 3, 수작업 3, 제약 3, 운반 2 | 128×128 PNG 확인 |
| `ClioneTwins` | 리오리네 | 매지컬 트윈 파워 | 다른 거점 팰 관개 `+1` | 관개 1, 수작업 2, 운반 1 | 128×128 PNG 확인 |
| `CubeTurtle` | 누름북 | 돌을 쌓는 고대 거북 | 다른 거점 팰 채굴 `+1` | 채굴 4 | 128×128 PNG 확인 |
| `ElecPomeranian` | 짜리링 | 짜릿짜릿 부스터 | 다른 거점 팰 발전 `+1` | 발전 2, 운반 1 | 128×128 PNG 확인 |

다섯 효과 모두 구조화 필드에서 `ToBaseCampPal`, `bNotAssignSelf=true`, `InvokeInBaseCamp=true`, `IsStackablePartnerSkillBySameTribe=false`가 확인됐다. 한국어 설명도 “다른 거점 팰”과 “중복 불가”로 일치했다. 파트너 파라미터 배열 인덱스 0~4(외부 사이트의 표시 랭크 0~4)의 작업 적성 증가량은 모두 `+1`이었다.

반복 명령 `sample`은 이 5종을 `sample.json`과 PNG 5장으로 생성하고 ID 중복, 한국어 텍스트, 아이콘 존재, 효과 수치와 랭크 개수를 검증한다. 생성물은 `.cache` 아래에 두며 Git에서 제외한다.

## 외부 교차검증

사용자가 지정한 [핑토 상세 페이지](https://palworld.shwa.space/pals/PinkRabbit)와 로컬 추출 결과를 대조했다. 이름, 도감 번호, 기본 능력치, 작업 적성, 파트너 이름·원문과 128×128 아이콘 경로가 일치했다.

외부 페이지의 파트너 원문은 “다른 거점 팰의 작업 적성 레벨 +1”이지만 바로 아래 랭크 표는 “거점의 모든 팰”과 `+1%`로 표시해 내부적으로 충돌했다. 로컬 구조화 필드와 원문이 함께 지지하는 `other_base_pals`, 레벨 `+1`을 유지한다. 상세 비교는 `docs/EXTERNAL_VALIDATION.md`에 기록했다.
## 전체 정규화 결과

`generate` 명령이 pak을 직접 마운트해 아래 생성물을 한 번에 만든다.

```text
data/generated/meta.json
data/generated/pals.json
data/generated/skills.json
public/generated/pals/*.webp
public/generated/ui/work-suitabilities/*.png
public/generated/ui/passive/*.png
data/generated/world-tree-eggs.json
public/generated/ui/maps/world-tree.webp
public/generated/ui/maps/ominous-egg.png
```

현재 Build ID `24181527` 결과:

| 구분 | 개수 | 판정 기준 |
| --- | ---: | --- |
| 정상 도감 팰 | 16 | `IsPal=true`, `IsBoss=false`, `ZukanIndex>=0`, 거점 작업 효과 보유 |
| 파트너 스킬 | 16 | 양수 `CraftSpeed` 또는 `WorkSuitabilityAddRank_*` 효과 |
| 표시 가능한 특성 | 9 | `Category=SortDisplayable`, 양수 거점 작업 효과 |
| 효과 단위 | 26 | 한 스킬의 다중 효과를 각각 분리 |
| WebP 아이콘 | 16 | 아이콘 DataTable soft object path를 선택 디코딩 |
| 작업 적성 PNG | 13 | `WBP_IconPalWork.IconMap`이 가리키는 컬러 Texture2D |
| 패시브 UI PNG | 15 | WBP와 세계수 머티리얼이 참조하는 프레임·패턴·등급 화살표·마스크 Texture2D |
| 세계수 알 포인트 | 30 | 생성 맵의 `bp_palmapobjectspawner_palegg_worldtree_grade_01_C` 배치 액터 |
| 검증 오류 | 0 | 생성기 내부 무결성 검사 결과 |

파트너 스킬 대상 팰은 눈댕이, 캐티위자드, 리오리네, 브루밍, 누름북,
귀요비, 산령사슴, 짜리링, 플로리나, 플루미, 흘루미, 머슐리, 핑토,
그래토, 세크메트, 움포다.

표시 가능한 작업 강화 특성은 `초절기교`, `장인 기질`, `성실함`, `희귀`,
`자만심`, `일 노예`, `악마의 손`, `목장 아이`, `목장 주인`이다.

### 특수 정규화 규칙

- `BOSS_*` 행은 같은 팰의 보스 개체 중복이므로 정상 도감 행에서 제외한다.
- 플루미·흘루미의 내부 `Watering`과 `Watering_Farm` 효과는 같은 관개 속도
  효과와 같은 랭크 수치이므로 한 효과로 합치고 원시 작업 타입 둘 다 남긴다.
- 플루미·흘루미의 `PalTribeIds`는 효과 대상이 아니라 발동 조건 팰로 분리한다.
- 세크메트는 자신의 수작업 속도 효과와 아누비스 대상 전체 작업 속도 효과를
  별도 효과 단위로 저장한다.
- 작업대·공장 `MapObjectId`로 제한된 `CraftSpeed`는 수작업으로 태깅하고
  근거를 `structured_with_map_object_context`로 표시한다.
- 플루미·흘루미 작업 속도 효과는 구조 필드의 중첩 플래그와 한국어 “중복
  불가”가 충돌하므로 `stackable=null`로 보존한다.
- 일반 작업 속도 특성은 특정 작업 하나가 아니라 모든 작업에 적용되므로
  `workSuitabilityId=null`을 유지하되, 검색용 적용 범위에는 13개 작업 ID를
  모두 기록한다.

### 작업 필터용 적용 범위

스키마 `1.3.0`부터 원본 효과의 특정 작업 여부와 검색 가능한 작업 범위를
분리한다.

- `workSuitabilityId`: 구조 필드가 명시한 특정 작업만 저장한다. 특정 작업이
  없는 `CraftSpeed`는 기존대로 `null`이다.
- `applicableWorkSuitabilityIds`: 해당 효과가 실제로 강화할 수 있는 작업 ID를
  저장하며 검색기는 이 배열만 사용한다.
- `workApplicabilityEvidenceKind`: 명시 작업, 전 작업 공통, 대상 팰 작업 적성,
  소유 팰 작업 적성 중 어떤 구조 근거로 배열을 만들었는지 저장한다.

`workSuitabilityId=null`을 전 작업 와일드카드로 취급하면 아누비스만 대상으로
하는 세크메트의 “전체 작업 속도” 효과까지 파종·채집에 노출된다. 현재 설치본
`DT_PalMonsterParameter`의 `Anubis` 행에서 양수 작업 적성을 다시 읽은 결과는
수작업, 채굴, 운반 3종이다. 따라서 이 효과의 적용 가능 작업도 세 종류로만
생성한다. 반대로 특정 작업이 없는 일반 작업 속도 특성 7개는 13종 전부를
유지한다.

생성기는 팰·스킬 ID 중복, 팰→파트너 스킬 참조, 한국어 필수 텍스트,
양수 효과, 작업 적성 ID, 파트너 랭크 5단계, 팰·작업 아이콘과 패시브 UI
이미지의 크기·SHA-256, 패시브 스타일·예시 참조뿐 아니라 모든 효과의 적용
가능 작업 배열이 비어 있지 않은지, 허용 ID만 쓰는지, 중복이 없는지도
검사한다.

## 세계수 불길한 알 지도

현재 설치본의 `DT_WorldMapUIData`에서 `Tree` 행을 읽어 아래 값을 기준으로
웹 지도를 생성한다.

| 항목 | 설치본 값 |
| --- | --- |
| 지도 Texture2D | `Pal/Content/Pal/Texture/UI/Map/T_TreeMap` |
| 원본 크기 | 8192×8192 |
| 월드 최소 | X `347351.5`, Y `-818197.0` |
| 월드 최대 | X `689148.5`, Y `-476400.0` |
| 웹 이미지 | 4096×4096 WebP, 약 2.2MB |
| 마커 아이콘 | `T_itemicon_Material_PalEgg_WorldTree_01` 256×256 PNG |

세계수 월드 파티션의 `MainGrid_L0` 패키지를 지도 범위로 좁혀 읽고,
`bp_palmapobjectspawner_palegg_worldtree_grade_01_C` 액터만 선택했다. 액터의
`RootComponent.RelativeLocation`을 읽은 결과 내부 라벨 1~30이 중복 없이
연속했고 총 30개였다. 위치는 프론트에 수동 입력하지 않고 추출 때마다 아래
정규화 좌표로 생성한다.

```text
left = (worldY - mapMinY) / (mapMaxY - mapMinY)
top  = 1 - (worldX - mapMinX) / (mapMaxX - mapMinX)
```

인게임 표시 좌표는 현재 설치본 `WBP_Map_Base.PrintPosition`의
`MapRangeUnclamped` 리터럴을 대조해 계산한다. X 표시는 world Y의
`-301000..617000`, Y 표시는 world X의 `-582888..335112`를 각각
`-1000..1000`에 매핑하고 게임과 같은 정수 반올림을 적용한다. 외부에서
보고된 돌기둥 위치 `(-1930, 1328)`은 설치본 포인트 9의 계산 결과
`(-1931, 1328)`과 한 칸 차이로 일치했다.

스포너 기본 객체의 `bIsWorldTreePalEgg=true`, `WorldTreePalEggProbability=10`,
획득 후 재생성 180분, 추첨 쿨타임 180분도 같은 JSON에 보존한다. 따라서 UI는
30곳을 “불길한 알 확정 출현”이라고 단정하지 않고 “세계수 알 추첨 포인트”로
표시한다.

### 포인트 4 지도 외곽 배치 검증

포인트 4는 지도 이미지가 그린 섬 실루엣보다 오른쪽에 보이지만 0~1 지도 범위
안에는 있다. UI에서 이 좌표를 안쪽으로 보정하지 않는다.

- 소스 패키지:
  `Pal/Content/Pal/Maps/MainWorld_5/PL_MainWorld5/_Generated_/MainGrid_L0_X22_Y-21_DL0`
- actor label: `bp_palmapobjectspawner_palegg_worldtree_grade_4`
- `RootComponent.RelativeLocation`: X `588770`, Y `-521620`, Z `27175`
- 인게임 표시 좌표: `(-1481, 1553)`
- 정규화 위치: left `0.8676992483842749`, top `0.293678704026074`

해당 패키지의 export 86개 중 세계수 알 actor는 이 한 개였고 root component의
위치도 생성 JSON과 일치했다. 현재 설치본 `WBP_Map_Base.PrintPosition`은
화면 가로에 world Y, 세로에 뒤집은 world X를 사용하므로 북동쪽인 이 좌표가
우상단에 놓이는 방향도 맞다. [PalDB 세계수 지도](https://paldb.cc/en/The_World_Tree?pos=102%2C773)는
세계수 알 30개를 표시하고, [외부 사용자 좌표 대조 글](https://www.reddit.com/r/Palworld/comments/1v643lr/all_ominous_egg_locations_in_palworld_10_world/)에도
지도 경계 밖 알 하나가 보인다는 지적이 있다. 외부 자료는 보조 근거이고 단일
기준은 설치본 actor 위치다.

프론트 줌은 캔버스 크기만 100~500%로 바꾸고 마커의 left/top 퍼센트는
유지한다. 커서 밑 정규화 지점을 줌 앵커로 저장해 새 scroll 위치를 계산하므로
휠 확대·축소와 드래그 뒤에도 actor 좌표가 변하지 않는다.

## 다음 검증

1. 사용자가 안전하게 제공하는 실제 게임 화면 또는 추가 외부 1.0 페이지로
   나머지 특수 사례를 표본 대조한다.
2. 로컬 웹 UI의 수동 사용성 점검과 제출 영상 녹화를 진행한다.
3. 게임 Build ID가 바뀌면 매핑 직렬화부터 다시 검증한다.
