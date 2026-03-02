# Contract: Dev Warm-up

## 목적

dev 서버 기동 직후 route compile 지연을 첫 사용자 요청 전에 선반영하기 위한 선택적 워밍업 계약을 정의한다.

## Contract Surface

- Entry point: `cli.ts`
- Trigger:
  - CLI flag: `--warmup` / `--no-warmup` / `--warmup-strict` / `--warmup-timeout` / `--warmup-retries` / `--warmup-paths`
  - Env: `MAGAM_WARMUP`, `MAGAM_WARMUP_STRICT`, `MAGAM_WARMUP_TIMEOUT_MS`, `MAGAM_WARMUP_RETRIES`, `MAGAM_WARMUP_PATHS`, `MAGAM_WARMUP_STARTUP_DELAY_MS`

## Behavior Contract

1. 기본값: 워밍업 비활성(`MAGAM_WARMUP=0`).
2. 활성화 시 Next dev와 WS 서버 기동 이후 워밍업을 시작한다.
3. 기본 경로 순서:
   - `GET /`
   - `GET /api/file-tree`
4. 요청은 순차 실행한다(병렬 금지).
5. 각 요청은 timeout + retry 정책을 따른다.
6. 워밍업 요청은 `x-magam-warmup: 1` 헤더를 포함한다.

## Failure Policy

- Non-strict(기본): 실패 시 warning 로그 후 계속 실행.
- Strict(`MAGAM_WARMUP_STRICT=1`): 실패 시 child process 종료 후 non-zero exit.

## Input Schema

| Field | Type | Default | Required |
|------|------|---------|----------|
| `enabled` | boolean | `false` | Yes |
| `strict` | boolean | `false` | Yes |
| `paths` | string[] | `['/','/api/file-tree']` | Yes |
| `timeoutMs` | number | `30000` | Yes |
| `retries` | number | `2` | Yes |
| `startupDelayMs` | number | `2500` | Yes |

## Validation Rules

- `timeoutMs >= 1000`
- `retries >= 0`
- `startupDelayMs >= 0`
- `paths`에 유효한 URL path만 허용
- `paths` 중복 금지

## Logging Contract

- Start: warm-up enabled 여부, 경로 목록, strict 모드 표시
- Per path: attempt 번호, 성공/실패, 소요 시간
- End: 전체 성공/부분 실패/strict 실패 종료 상태

## Compatibility Notes

- 워밍업 기능은 편의 기능이며, 비활성 시 기존 동작과 완전히 동일해야 한다.
- `app/app/api/file-tree/route.ts`는 워밍업 검증 일관성을 위해 dynamic/no-store 정책을 명시할 수 있다(선택).
