# 2026-02-17 — Shape + Lucide 문서/예제 정리 (Issue #69)

## Summary
- Shape/Lucide 관련 문서와 예제를 **children 선언형 기준**으로 정리했습니다.
- `icon` prop 제거를 **Breaking Change**로 명시했습니다.
- 릴리스 노트에 바로 붙일 수 있는 마이그레이션 스니펫을 추가했습니다.

## Breaking Change
- `Shape`, `Sticky`, `MindMap Node`, `Sticker`에서 `icon` prop 지원이 제거되었습니다.
- 아이콘은 다음과 같이 children으로 선언해야 합니다.

```tsx
<Shape id="auth">
  <Bug size={16} />
  Auth Service
</Shape>
```

## Migration Snippets

### Before
```tsx
<Shape id="auth"><Bug /></Shape>
<Sticky id="todo"><Rocket />Deploy</Sticky>
<Node id="backend" from="stack"><Cpu />Backend</Node>
```

### After
```tsx
<Shape id="auth">
  <Bug size={16} />
  Auth Service
</Shape>

<Sticky id="todo">
  <Rocket size={14} />
  Deploy
</Sticky>

<Node id="backend" from="stack">
  <Cpu size={14} />
  Backend
</Node>
```
