# Mermaid Kanban Reference

## Quick Reference

Use this minimal structure:

```mermaid
kanban
  columnId[Column Label]
    taskId[Task Label]
```

Use this metadata structure:

```mermaid
kanban
  todo[To Do]
    task1[Plan release]@{ assigned: 'alex', ticket: 'REL-12', priority: 'High' }
```

Metadata keys:
- `assigned`
- `ticket`
- `priority` (`Neutral`, `Very High`, `High`, `Low`, `Very Low`)

## Ticket URL Configuration

Set base ticket URL in frontmatter:

```mermaid
---
config:
  kanban:
    ticketBaseUrl: "https://tracker.example.com/tickets/#TICKET#"
---
kanban
  inProgress[In Progress]
    task9[Investigate timeout]@{ ticket: 'OPS-9' }
```

`#TICKET#` is replaced with the task ticket value.

## Reusable Templates

### Product Delivery Board

```mermaid
kanban
  backlog[Backlog]
    t1[Collect requirements]
    t2[Define scope]
  ready[Ready]
    t3[Break down tasks]
  doing[Doing]
    t4[Build feature A]@{ assigned: 'mira', ticket: 'APP-221', priority: 'High' }
  review[Review]
    t5[Run acceptance tests]
  done[Done]
    t6[Ship to production]
```

### Support Board

```mermaid
kanban
  triage[Triage]
    s1[Reproduce payment bug]@{ priority: 'Very High' }
  fixInProgress[Fix In Progress]
    s2[Patch API timeout]@{ assigned: 'sam', ticket: 'OPS-78', priority: 'High' }
  verify[Verify]
    s3[Regression test]
  closed[Closed]
    s4[Publish incident summary]
```

## Failure Patterns and Fixes

1. Diagram does not render:
- Confirm first non-frontmatter line is exactly `kanban`.

2. Tasks render outside columns:
- Ensure task lines are indented under a column line.

3. Metadata ignored:
- Use exact format `@{ key: 'value' }` on the same task line.

4. Ticket links do not open:
- Confirm `ticketBaseUrl` contains `#TICKET#`.
- Confirm each linked task has `ticket` metadata.

5. Priority style looks wrong:
- Use supported priority values only.

## Authoring Rules for This Skill

When producing Kanban output for users:
1. Keep column count between 3 and 7 unless the user explicitly asks otherwise.
2. Use concise, action-oriented task labels.
3. Add metadata only when it supports execution (owner, ticket, urgency).
4. Prefer stable task IDs so iterative updates produce clean diffs.
