# Lucide 아이콘 v1 릴리스 체크리스트

## 기능
- [x] 아이콘 레지스트리(subset) 도입
- [x] 아이콘 검색(prefix > includes > alphabetical)
- [x] 최근 사용 아이콘(localStorage, 최대 8)
- [x] 노드 아이콘 적용/제거
- [x] 노드 렌더 반영(Shape/Sticky/Text/Markdown)

## 저장/호환성
- [x] NodeData icon 로드 반영
- [x] patch 시 `icon: null` => attribute 제거(omit)
- [x] 기존 문서(icon 없음) 호환

## 접근성
- [x] 키보드 탐색(↑/↓/Enter/Esc)
- [x] listbox/option role
- [x] aria-selected, aria-controls, aria-activedescendant 적용

## 품질
- [x] 유틸 테스트(lucideRegistry/iconSearch/iconRecent)
- [x] filePatcher 테스트(icon omit 정책 포함)
- [ ] 통합/E2E 시나리오 수동 점검

## Telemetry
- [x] icon_picker_opened
- [x] icon_applied
- [x] icon_removed
- [x] icon_search_used
- [x] icon_render_fallback
- [x] payload 스키마(icon_name/source/success/duration_ms) 반영
