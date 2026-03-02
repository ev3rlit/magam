import { Canvas, MindMap, Node, Markdown } from '@magam/core';

// Layout Strategy Comparison
// Real-world project structure with varying depths (1~4) and mixed content sizes

function ProjectNodes({ label }: { label: string }) {
  return (
    <>
      {/* Depth 0: Root — large markdown block */}
      <Node id="root">
        <Markdown>{`# SaaS Platform
*${label}*

> Full-stack product roadmap`}</Markdown>
      </Node>

      {/* ─── Branch 1: Frontend (depth 4) ─── */}
      <Node id="fe" from="root">
        <Markdown>{`## Frontend
React 19 + Next.js 15`}</Markdown>
      </Node>

      <Node id="fe-auth" from="fe">
        <Markdown>{`### Auth Module
- OAuth2 / OIDC
- Session management
- RBAC middleware`}</Markdown>
      </Node>
      <Node id="fe-auth-google" from="fe-auth">Google SSO</Node>
      <Node id="fe-auth-github" from="fe-auth">GitHub SSO</Node>
      <Node id="fe-auth-mfa" from="fe-auth">
        <Markdown>{`**MFA**
TOTP + WebAuthn`}</Markdown>
      </Node>

      <Node id="fe-dash" from="fe">
        <Markdown>{`### Dashboard
- Chart.js widgets
- Real-time updates`}</Markdown>
      </Node>
      <Node id="fe-dash-analytics" from="fe-dash">Analytics View</Node>
      <Node id="fe-dash-alerts" from="fe-dash">Alert Panel</Node>

      <Node id="fe-design" from="fe">Design System</Node>
      <Node id="fe-design-tokens" from="fe-design">Tokens</Node>
      <Node id="fe-design-components" from="fe-design">
        <Markdown>{`**Components**
Button, Input, Modal, Toast, Table, Card`}</Markdown>
      </Node>

      {/* ─── Branch 2: Backend (depth 4) ─── */}
      <Node id="be" from="root">
        <Markdown>{`## Backend
Node.js + Hono`}</Markdown>
      </Node>

      <Node id="be-api" from="be">
        <Markdown>{`### REST API
- OpenAPI 3.1 spec
- Rate limiting
- Versioned routes`}</Markdown>
      </Node>
      <Node id="be-api-users" from="be-api">Users CRUD</Node>
      <Node id="be-api-billing" from="be-api">
        <Markdown>{`**Billing**
Stripe integration, webhooks, invoices`}</Markdown>
      </Node>
      <Node id="be-api-webhooks" from="be-api">Webhook Dispatch</Node>

      <Node id="be-ws" from="be">
        <Markdown>{`### WebSocket
JSON-RPC 2.0 protocol`}</Markdown>
      </Node>
      <Node id="be-ws-presence" from="be-ws">Presence</Node>
      <Node id="be-ws-sync" from="be-ws">Real-time Sync</Node>

      <Node id="be-jobs" from="be">Background Jobs</Node>
      <Node id="be-jobs-email" from="be-jobs">Email Queue</Node>
      <Node id="be-jobs-export" from="be-jobs">CSV Export</Node>

      {/* ─── Branch 3: Infra (depth 3) ─── */}
      <Node id="infra" from="root">
        <Markdown>{`## Infrastructure
AWS + Terraform`}</Markdown>
      </Node>

      <Node id="infra-ci" from="infra">
        <Markdown>{`### CI/CD
GitHub Actions
- lint → test → build → deploy
- Preview on PR`}</Markdown>
      </Node>

      <Node id="infra-db" from="infra">
        <Markdown>{`### Database
PostgreSQL 16 + pgvector`}</Markdown>
      </Node>
      <Node id="infra-db-migrations" from="infra-db">Drizzle Migrations</Node>
      <Node id="infra-db-replica" from="infra-db">Read Replica</Node>

      <Node id="infra-cache" from="infra">Redis Cache</Node>

      <Node id="infra-monitoring" from="infra">
        <Markdown>{`### Monitoring
- Grafana dashboards
- PagerDuty alerts
- Sentry error tracking`}</Markdown>
      </Node>

      {/* ─── Branch 4: Mobile (depth 2, shallow) ─── */}
      <Node id="mobile" from="root">
        <Markdown>{`## Mobile
React Native + Expo`}</Markdown>
      </Node>
      <Node id="mobile-ios" from="mobile">iOS App</Node>
      <Node id="mobile-android" from="mobile">Android App</Node>
      <Node id="mobile-push" from="mobile">
        <Markdown>{`**Push Notifications**
FCM + APNs`}</Markdown>
      </Node>

      {/* ─── Branch 5: AI (depth 1, leaf only) ─── */}
      <Node id="ai" from="root">
        <Markdown>{`## AI Features
RAG pipeline, embeddings, Claude API`}</Markdown>
      </Node>
    </>
  );
}

export default function LayoutComparison() {
  return (
    <Canvas>
      <MindMap id="tree-map" layout="tree">
        <ProjectNodes label='layout="tree"' />
      </MindMap>

      <MindMap id="bidir-map" layout="bidirectional" x={0} y={900}>
        <ProjectNodes label='layout="bidirectional"' />
      </MindMap>

      <MindMap id="compact-map" layout="compact" x={0} y={1800}>
        <ProjectNodes label='layout="compact"' />
      </MindMap>

      <MindMap id="compact-bidir-map" layout="compact-bidir" x={0} y={2700}>
        <ProjectNodes label='layout="compact-bidir"' />
      </MindMap>

      <MindMap id="depth-hybrid-map" layout="depth-hybrid" x={0} y={3600}>
        <ProjectNodes label='layout="depth-hybrid"' />
      </MindMap>

      <MindMap id="treemap-pack-map" layout="treemap-pack" x={0} y={4500}>
        <ProjectNodes label='layout="treemap-pack"' />
      </MindMap>

      <MindMap id="quadrant-pack-map" layout="quadrant-pack" x={0} y={5400}>
        <ProjectNodes label='layout="quadrant-pack"' />
      </MindMap>
    </Canvas>
  );
}
