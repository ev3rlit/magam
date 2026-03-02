# Quickstart: Compile & Explorer Performance

## 목적

`003-compile-explorer-performance` 구현/검증을 재현 가능한 순서로 실행한다.

## 1) 환경 준비

```bash
cd /Users/danghamo/Documents/gituhb/magam-compile-time-improvement
bun install
```

## 2) 성능 스크립트 실행

```bash
# build cold/warm + 단계별 계측
bun run perf:build

# (별도 터미널) dev 서버 실행 (warmup 옵션은 필요 시)
bun run cli.ts dev ./examples --port 3050 --warmup

# dev route 계측
bash scripts/perf/measure-dev-routes.sh \
  --label current \
  --base-url http://localhost:3050 \
  --touch-file app/app/page.tsx \
  --dev-log /tmp/magam-dev-perf.log

# API 계측
bash scripts/perf/measure-api-latency.sh \
  --label current \
  --samples 20 \
  --direct-base-url http://localhost:3003 \
  --proxy-base-url http://localhost:3050/api

# 정합성 회귀 확인
bun run perf:verify:render
bun run perf:verify:filetree

# baseline/current 보고서
bun run perf:report
```

## 3) 결과 위치

- `scripts/perf/artifacts/current/build-metrics.ndjson`
- `scripts/perf/artifacts/current/dev-route-metrics.ndjson`
- `scripts/perf/artifacts/current/api-metrics.ndjson`
- `scripts/perf/artifacts/current/report.md`

## 4) 검증 체크

- `bun test libs/cli/src/server/http.spec.ts`
- `bun test app/components/nodes/renderableContent.test.tsx`

## 5) caveats

1. `next-proxy` 지표는 dev route compile 상황에 따라 편차가 크다.
2. `measure-dev-routes.sh`의 `compiledInSec`는 로그 파싱 기반이며 로그 보존 위치(`--dev-log`)가 정확해야 한다.
3. baseline 비교를 위해 `scripts/perf/artifacts/baseline`을 같은 머신/같은 명령으로 먼저 생성해야 한다.
4. `app` 전체 타입체크에는 기존 테스트 타입 이슈(Buffer/BlobPart)가 있어 별도 정리 전까지 실패할 수 있다.
