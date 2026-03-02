# Contract: Performance Instrumentation

## 목적

빌드/라우트/API 성능 측정을 동일 포맷으로 기록해 baseline 대비 개선을 재현 가능하게 만든다.

## Contract Surface

- Producer:
  - `scripts/perf/measure-build.sh` (`bun run build`, 단계별 `bun run --filter ...`)
  - `scripts/perf/measure-dev-routes.sh` (`next dev` 요청 시간 + compile 로그 파싱)
  - `scripts/perf/measure-api-latency.sh` (`/render`, `/file-tree` 반복 호출)
- Consumer:
  - `docs/features/compile-explorer-performance/README.md`의 baseline 섹션
  - `specs/003-compile-explorer-performance/*` 산출물 및 후속 tasks

## Metric Schema

### Build Metrics

| Field | Type | Required |
|------|------|----------|
| `command` | string | Yes |
| `stage` | string | Yes |
| `mode` | `cold` \| `warm` | Yes |
| `realSec` | number | Yes |
| `userSec` | number | No |
| `sysSec` | number | No |
| `status` | number | No |

### Dev Route Metrics

| Field | Type | Required |
|------|------|----------|
| `route` | string | Yes |
| `phase` | `first-load` \| `after-change` \| `warm-repeat` | Yes |
| `requestTimeSec` | number | Yes |
| `compiledInSec` | number | No |

### API Metrics

| Field | Type | Required |
|------|------|----------|
| `endpoint` | `/render` \| `/file-tree` | Yes |
| `pathType` | `direct-cli-http` \| `next-proxy` | Yes |
| `scenario` | `cold` \| `warm` | Yes |
| `n` | number | Yes |
| `minMs` | number | Yes |
| `avgMs` | number | Yes |
| `p50Ms` | number | Yes |
| `p95Ms` | number | Yes |
| `maxMs` | number | Yes |

## Recording Rules

1. 개선 전/후는 동일 머신, 동일 명령, 동일 샘플 수로 측정한다.
2. `cold` 측정은 캐시 초기화 과정을 명시해야 한다(예: `rm -rf app/.next`).
3. `warm` 측정은 직전 실행 직후 재실행으로 측정한다.
4. 로그 파싱 실패 시 해당 측정은 무효 처리하고 재측정한다.

## Success Gate Mapping

- `SC-001`, `SC-002`: `/render` warm p95
- `SC-003`, `SC-004`: `/file-tree` warm p95
- `SC-005`: dev `GET /` first-load
- `SC-006`: `bun run build` total + `build:app` 단계 시간

## Compatibility Notes

- 기존 기능 계약(렌더 정확성, Explorer 결과 정확성)을 변경하지 않는다.
- 측정은 관측 경로이며 제품 동작을 바꾸지 않아야 한다.
