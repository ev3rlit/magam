# 2026-03-03 — `/api/render` JSON 파싱 실패(HTML 응답) 원인 기록

## 증상
- 브라우저 콘솔:
  - `:3000/api/render:1 Failed to load resource: the server responded with a status of 500`
  - `SyntaxError: Unexpected token '<', "<!DOCTYPE "... is not valid JSON`
- 에디터 측 로그:
  - `Failed to render file: SyntaxError ...`

## 원인
- `/api/render` 호출 경로에서 **응답이 항상 JSON이라고 가정**하고 `response.json()`을 바로 호출했다.
- 실제로는 업스트림(렌더 서버/프록시 체인) 오류 상황에서 HTML(`<!DOCTYPE ...>`)이 반환되는 케이스가 발생했다.
- 그 결과 원래 500 원인보다 먼저 JSON 파싱 예외가 터지면서, 실제 에러 정보가 가려졌다.

## 영향
- 사용자 입장에서는 "왜 500이 났는지" 대신 JSON 파싱 에러만 보이게 되어 원인 파악이 어려웠다.
- 장애 원인이 렌더 실패인지, 프록시 실패인지, 업스트림 HTML 에러 페이지인지 즉시 구분하기 어려웠다.

## 대응
- 서버 프록시(`app/app/api/render/route.ts`)
  - 업스트림 응답을 먼저 `text()`로 수신 후 JSON 파싱 시도.
  - JSON 파싱 실패 시 `UPSTREAM_NON_JSON` 타입의 구조화된 JSON 에러로 변환해 반환.
- 클라이언트(`app/components/editor/WorkspaceClient.tsx`)
  - `/api/render` 응답을 먼저 `text()`로 받고 JSON 파싱.
  - 파싱 실패 시 `INVALID_RENDER_RESPONSE`로 ErrorOverlay에 노출.

## 재발 방지 포인트
- API 프록시 계층에서는 "업스트림이 JSON을 항상 지킨다"는 가정을 두지 않는다.
- 클라이언트 네트워크 계층은 `response.json()` 직행 대신 `text() -> safe parse`를 기본으로 한다.
- 파싱 실패 시 원문 일부(`details`)를 포함해 운영자가 즉시 원인(HTML/JSON/빈 응답)을 판별할 수 있게 한다.
