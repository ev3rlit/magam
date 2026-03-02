# Data Model: Compile & Explorer Performance

## 1) BuildTimingSample

- Purpose: 빌드 성능 기준선 및 개선 결과 비교를 위한 측정 단위.

### Fields

| Field | Type | Required | Description |
|------|------|----------|-------------|
| `id` | string | Yes | 측정 실행 식별자 (`YYYYMMDD-HHMMSS`) |
| `mode` | `'cold' \| 'warm'` | Yes | 캐시 상태 |
| `command` | string | Yes | 실행 명령 (`bun run build`, `next build`, etc.) |
| `stage` | `'full' \| 'shared' \| 'core' \| 'runtime' \| 'cli' \| 'app'` | Yes | 빌드 단계 |
| `realSec` | number | Yes | wall-clock 시간 |
| `userSec` | number | No | user CPU 시간 |
| `sysSec` | number | No | sys CPU 시간 |
| `timestamp` | string | Yes | ISO8601 시각 |

### Validation Rules

- `realSec > 0`
- `mode`는 반드시 `cold` 또는 `warm`
- 동일 `id` 안에서 `stage`는 중복되지 않음

## 2) RouteCompileTimingSample

- Purpose: Next dev route compile 지연 측정 단위.

### Fields

| Field | Type | Required | Description |
|------|------|----------|-------------|
| `route` | `'/' \| '/api/file-tree'` | Yes | 측정 라우트 |
| `phase` | `'first-load' \| 'after-change' \| 'warm-repeat'` | Yes | 요청 단계 |
| `requestTimeSec` | number | Yes | HTTP 요청 시간 |
| `compiledInSec` | number | No | Next 로그의 `Compiled ... in Xs` 값 |
| `trigger` | `'startup' \| 'file-touch' \| 'manual'` | Yes | 측정 트리거 |
| `timestamp` | string | Yes | ISO8601 시각 |

### Validation Rules

- `requestTimeSec > 0`
- `compiledInSec`는 존재 시 `> 0`

## 3) ApiTimingSample

- Purpose: 백엔드 단독 및 프록시 경유 API latency 비교.

### Fields

| Field | Type | Required | Description |
|------|------|----------|-------------|
| `endpoint` | `'/render' \| '/file-tree'` | Yes | 대상 API |
| `pathType` | `'direct-cli-http' \| 'next-proxy'` | Yes | 호출 경로 |
| `scenario` | `'cold' \| 'warm'` | Yes | 캐시 상태 |
| `n` | number | Yes | 샘플 수 |
| `minMs` | number | Yes | 최소값 |
| `avgMs` | number | Yes | 평균값 |
| `p50Ms` | number | Yes | p50 |
| `p95Ms` | number | Yes | p95 |
| `maxMs` | number | Yes | 최대값 |
| `timestamp` | string | Yes | ISO8601 시각 |

### Validation Rules

- `n >= 1`
- `minMs <= p50Ms <= p95Ms <= maxMs`

## 4) OptimizationItem

- Purpose: 최적화 작업 단위 및 검증 상태 추적.

### Fields

| Field | Type | Required | Description |
|------|------|----------|-------------|
| `key` | `'client-boundary-split' \| 'heavy-deps-lazy-load' \| 'dev-warmup' \| 'render-cache' \| 'file-tree-cache'` | Yes | 작업 식별자 |
| `status` | `'planned' \| 'in-progress' \| 'validated' \| 'rolled-back'` | Yes | 진행 상태 |
| `targetMetrics` | string[] | Yes | 기대 개선 지표 키 |
| `riskLevel` | `'low' \| 'medium' \| 'high'` | Yes | 위험 등급 |
| `rollbackRule` | string | Yes | 회귀 시 복구 기준 |

### Validation Rules

- `validated` 상태는 최소 1개 이상의 지표 개선 결과를 포함해야 함
- `high` 위험은 rollback rule 필수

## 5) DevWarmupConfig

- Purpose: dev 워밍업 정책 입력 모델.

### Fields

| Field | Type | Required | Description |
|------|------|----------|-------------|
| `enabled` | boolean | Yes | 워밍업 실행 여부 |
| `strict` | boolean | Yes | 실패 시 종료 여부 |
| `paths` | string[] | Yes | 워밍업 경로 목록 (`/`, `/api/file-tree`) |
| `timeoutMs` | number | Yes | 요청 타임아웃 |
| `retries` | number | Yes | 재시도 횟수 |
| `startupDelayMs` | number | Yes | Next 초기 기동 대기 시간(ms) |

### Validation Rules

- `timeoutMs >= 1000`
- `retries >= 0`
- `startupDelayMs >= 0`
- `paths`는 최소 1개, 중복 불가

## Relationships

- `OptimizationItem.targetMetrics` -> `BuildTimingSample` / `RouteCompileTimingSample` / `ApiTimingSample` 지표 키 참조
- `DevWarmupConfig` -> `RouteCompileTimingSample`의 `first-load` 개선 결과와 직접 연관

## State Transitions

1. `planned` -> `in-progress`
   - Trigger: 최적화 코드 변경 시작
2. `in-progress` -> `validated`
   - Trigger: 정의된 지표(예: `GET /` first-load, `build:app` realSec) 개선 확인
3. `in-progress` -> `rolled-back`
   - Trigger: 기능 회귀 또는 지표 악화
4. `validated` -> `rolled-back` (조건부)
   - Trigger: 후속 측정에서 회귀 감지

## Implementation Mapping (2026-03-02)

- `BuildTimingSample`, `RouteCompileTimingSample`, `ApiTimingSample`는 `scripts/perf/artifacts/current/*.ndjson`로 저장됨.
- `OptimizationItem` 상태 기록은 `docs/features/compile-explorer-performance/README.md`의 섹션 단위로 추적함.
- `DevWarmupConfig`는 `cli.ts`의 CLI flag + `MAGAM_WARMUP*` env 파싱으로 실체화됨.
