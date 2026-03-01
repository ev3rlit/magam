# 기능 명세서: 종이류 & 소재 확장 (Post-it Paper Material)

**기능 브랜치**: `002-paper-material`  
**작성일**: 2026-03-02  
**상태**: 초안  
**입력**: 사용자 설명: `docs/features/paper-material/README.md`

## 사용자 시나리오 및 테스트 *(필수)*

### 사용자 스토리 1 - 프리셋 기반 메모 맥락 구분 (우선순위: P1)

저널링 사용자는 포스트잇 추가 직후 기본 종이 질감이 적용된 메모를 생성하고, 프리셋/모양을 빠르게 바꿔 메모의 성격을 시각적으로 구분한다.

**우선순위 근거**: v1의 핵심 가치(즉시 생성 + 맥락 구분)를 직접 제공한다.

**독립 테스트**: Sticky를 추가하고 `preset`/`shape` 조합을 바꿔 저장-재열기 후 동일하게 복원되는지 확인하면 독립 검증 가능하다.

**인수 시나리오**:

1. **Given** 사용자가 새 Sticky를 생성하고, **When** `pattern`을 지정하지 않으면, **Then** 기본값 `preset('postit')`으로 렌더링된다.
2. **Given** 사용자가 `lined-warm`, `grid-standard`, `kraft-natural` 등 프리셋을 선택하고, **When** 모양(`heart`, `cloud`, `speech`)을 변경하면, **Then** 소재와 모양이 독립적으로 조합되어 일관되게 렌더링된다.
3. **Given** 사용자가 문서를 저장 후 다시 열고, **When** 동일 Sticky를 확인하면, **Then** 프리셋 ID, 모양, 텍스트 컬러가 유지된다.

---

### 사용자 스토리 2 - 커스텀 소재 안전 적용 (우선순위: P2)

사용자는 SVG/이미지/단색 소재를 동일한 API로 적용하고, 잘못된 입력이 들어와도 세션 중단 없이 안전한 fallback 결과를 얻는다.

**우선순위 근거**: 브랜드/테마 커스터마이징 요구를 충족하는 핵심 확장성이다.

**독립 테스트**: `svg`, `image`, `solid` 타입 각각을 적용하고 무효 입력을 주입해 fallback 동작을 확인하면 독립 검증 가능하다.

**인수 시나리오**:

1. **Given** 유효한 SVG 마크업 또는 이미지 소스가 있고, **When** `pattern`에 반영하면, **Then** 타일/스케일/반복 규칙에 맞게 즉시 렌더링된다.
2. **Given** 무효 SVG, 깨진 이미지 URL, 빈 color 문자열이 입력되고, **When** 렌더링 시도하면, **Then** throw 없이 기본 프리셋으로 fallback되고 이유가 추적 가능해야 한다.

---

### 사용자 스토리 3 - 위치/사이징 일관성 확보 (우선순위: P3)

사용자는 `at` 기반 상대 배치와 `width/height` 전략을 사용해 Sticky/WashiTape를 예측 가능하게 배치한다.

**우선순위 근거**: 실제 문서 작성에서 레이아웃 일관성과 재현성이 필수다.

**독립 테스트**: `at={anchor(...)}`, `at={attach(...)}`, `width` 단독/고정 `width+height` 케이스를 저장-재열기 및 export 결과로 검증하면 된다.

**인수 시나리오**:

1. **Given** `at`과 `x,y`가 동시에 존재하고, **When** 노드를 렌더링하면, **Then** `at`이 우선 적용된다.
2. **Given** `width`만 지정된 Sticky가 있고, **When** 텍스트가 길어지면, **Then** 줄바꿈 후 높이가 자동 확장된다.
3. **Given** `width`와 `height`가 모두 지정된 Sticky가 있고, **When** 텍스트가 영역을 넘기면, **Then** 프레임은 고정 크기이며 오버플로우는 클리핑된다.

### 엣지 케이스

- `image.scale`이 허용 범위(0.25~4)를 벗어날 때 보정 또는 fallback 정책은 무엇인가?
- `at.target`이 스코프 내에서 해석되지 않거나 대상이 삭제된 경우 어떤 기본 위치를 적용하는가?
- SVG 마크업이 크기 제한 또는 allowlist를 초과할 때 사용자에게 어떤 오류 정보를 남기는가?
- 100개 이상의 Sticky/WashiTape 혼합 장면에서 패턴 렌더와 이동 성능은 유지되는가?
- preset ID가 외부 입력에서 유실/오타인 경우 저장 데이터는 유지하되 렌더는 어떻게 안전하게 대체하는가?

## 요구사항 *(필수)*

### 기능 요구사항

- **FR-001**: 시스템은 Sticky 소재 소스를 `preset`, `svg`, `image`, `solid` 4가지로 표준화해야 한다.
- **FR-002**: 시스템은 `pattern`이 없을 때 컴포넌트 기본 프리셋(Sticky=`postit`)으로 렌더링해야 한다.
- **FR-003**: 시스템은 v1 프리셋 카탈로그(기존 6종 + 노트 4종 + 크래프트 1종)를 `MaterialPresetId` 리터럴 유니온으로 관리해야 한다.
- **FR-004**: 시스템은 `pattern` helper(`preset`, `svg`, `image`, `solid`, `definePattern`)를 제공해 타입 안전한 생성 경로를 보장해야 한다.
- **FR-005**: 시스템은 `at` prop(`anchor`, `attach`)을 지원하고, `at > x,y > 오류` 우선순위를 강제해야 한다.
- **FR-006**: 시스템은 `at.target`을 기존 `resolveTreeAnchors` EmbedScope 해석 흐름에 포함해야 한다.
- **FR-007**: 시스템은 `width/height` 지정 조합별 사이징 동작(자동/부분고정/완전고정+클리핑)을 일관되게 보장해야 한다.
- **FR-008**: 시스템은 Shape(`heart`, `cloud`, `speech`)과 소재(`pattern`)를 독립 축으로 조합 가능해야 한다.
- **FR-009**: 시스템은 구형 `color`/`anchor` 입력을 하위 호환으로 허용하되, 내부적으로 `pattern`/`at`로 정규화해야 한다.
- **FR-010**: 시스템은 미등록 preset ID, 무효 색상, 무효 SVG, 이미지 로드 실패에서 절대 세션을 중단하지 않고 fallback 렌더링을 제공해야 한다.
- **FR-011**: 시스템은 저장/재로드 및 export(PNG/JPEG/SVG/PDF)에서 소재/위치/사이즈 시각 결과를 최대한 일치시켜야 한다.
- **FR-012**: 시스템은 런타임 throw 대신 명시적 디버그 정보(`fallbackApplied`, `debugReason`)를 노출해 원인 추적이 가능해야 한다.

### 핵심 엔티티 *(데이터가 관련된 경우 포함)*

- **PaperMaterial**: `preset | svg | image | solid` 분기와 타입별 필수 필드를 갖는 소재 계약.
- **MaterialPresetRegistry**: preset ID, label, `backgroundColor`, `backgroundImage`, `backgroundSize`, `textColor`를 보관하는 단일 소스.
- **AtDef**: `anchor | attach | polar | segment` 기반 상대/절대 배치 계약.
- **StickyRenderState**: 원본 props(`pattern`, `at`, `color`, `x`, `y`, `shape`)와 정규화 결과(계산 좌표, fallback 여부)를 포함한 렌더 입력 상태.

## 성공 기준 *(필수)*

### 측정 가능한 결과

- **SC-001**: 신규 소재 카탈로그 11종이 타입 오류 없이 빌드에 포함되고, 수동 검증에서 100% 렌더링된다.
- **SC-002**: 저장-재열기 회귀 테스트에서 소재 타입/값 보존율이 100%를 달성한다.
- **SC-003**: 무효 소재 입력 테스트 케이스에서 크래시 0건, fallback 적용률 100%를 달성한다.
- **SC-004**: `at` 기반 배치 테스트(최소 20케이스)에서 목표 위치 오차가 허용 범위(레이아웃 계산 기준) 내에 유지된다.
- **SC-005**: 100개 노트 혼합 장면에서 삽입/이동 체감 지연이 기존 Sticky 기능 대비 유의미하게 악화되지 않는다.
