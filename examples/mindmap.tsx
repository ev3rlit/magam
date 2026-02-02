import { Canvas, MindMap, Node, Text, Edge } from '@graphwrite/core';

/**
 * Backend Architecture MindMap - 백엔드, NestJS, MSA 주제
 * 
 * 여러 개의 MindMap 컴포넌트와 여러 개의 루트 노드를 가지는 예제
 */
export default function BackendMindMapExample() {
  return (
    <Canvas>

      {/* ===== 1. 백엔드 기초 MindMap ===== */}
      <MindMap x={50} y={50} layout="tree" spacing={70}>

        {/* 루트 1: 백엔드 기본 개념 */}
        <Node id="backend" className="bg-slate-800 p-4 rounded-lg">
          <Text className="text-xl font-bold text-white">🖥️ Backend</Text>
        </Node>

        <Node id="api" from="backend" className="bg-slate-100 p-3">
          <Text className="font-bold">API Design</Text>
          <Text className="text-sm text-slate-500">REST, GraphQL</Text>
        </Node>

        <Node id="db" from="backend" className="bg-slate-100 p-3">
          <Text className="font-bold">Database</Text>
          <Text className="text-sm text-slate-500">SQL, NoSQL</Text>
        </Node>

        <Node id="auth" from="backend" className="bg-slate-100 p-3">
          <Text className="font-bold">Authentication</Text>
        </Node>

        {/* API 하위 */}
        <Node id="rest" from="api">REST API</Node>
        <Node id="graphql" from="api">GraphQL</Node>
        <Node id="grpc" from="api">gRPC</Node>

        {/* DB 하위 */}
        <Node id="postgres" from="db">PostgreSQL</Node>
        <Node id="mongo" from="db">MongoDB</Node>
        <Node id="redis" from="db">Redis (Cache)</Node>

        {/* Auth 하위 */}
        <Node id="jwt" from="auth">JWT</Node>
        <Node id="oauth" from="auth">OAuth 2.0</Node>
        <Node id="session" from="auth">Session</Node>

        {/* 루트 2: 인프라 (같은 MindMap 내 별도 트리) */}
        <Node id="infra" className="bg-blue-800 text-white p-4 rounded-lg">
          <Text className="text-xl font-bold">☁️ Infrastructure</Text>
        </Node>

        <Node id="docker" from="infra">Docker</Node>
        <Node id="k8s" from="infra">Kubernetes</Node>
        <Node id="cicd" from="infra">CI/CD</Node>

      </MindMap>

      {/* ===== 2. NestJS Framework MindMap ===== */}
      <MindMap x={800} y={50} layout="tree" spacing={60}>

        <Node id="nest" className="bg-red-600 text-white p-4 rounded-lg">
          <Text className="text-xl font-bold">🐱 NestJS</Text>
        </Node>

        <Node id="modules" from="nest" className="bg-red-50 p-3">
          <Text className="font-bold">Modules</Text>
          <Text className="text-sm text-red-400">기능별 캡슐화</Text>
        </Node>

        <Node id="controllers" from="nest" className="bg-red-50 p-3">
          <Text className="font-bold">Controllers</Text>
          <Text className="text-sm text-red-400">HTTP 요청 처리</Text>
        </Node>

        <Node id="providers" from="nest" className="bg-red-50 p-3">
          <Text className="font-bold">Providers</Text>
          <Text className="text-sm text-red-400">비즈니스 로직</Text>
        </Node>

        {/* Modules 하위 */}
        <Node id="appmodule" from="modules">AppModule</Node>
        <Node id="featuremodule" from="modules">Feature Modules</Node>
        <Node id="sharedmodule" from="modules">Shared Module</Node>

        {/* Controllers 하위 */}
        <Node id="decorators" from="controllers">@Controller()</Node>
        <Node id="routes" from="controllers">Route Handlers</Node>
        <Node id="guards" from="controllers">Guards</Node>

        {/* Providers 하위 */}
        <Node id="services" from="providers">Services</Node>
        <Node id="repositories" from="providers">Repositories</Node>
        <Node id="pipes" from="providers">Pipes</Node>

        {/* NestJS 추가 개념 */}
        <Node id="middleware" from="nest">Middleware</Node>
        <Node id="interceptors" from="nest">Interceptors</Node>
        <Node id="filters" from="nest">Exception Filters</Node>

      </MindMap>

      {/* ===== 3. MSA (Microservices Architecture) MindMap ===== */}
      <MindMap x={50} y={550} layout="tree" spacing={80}>

        <Node id="msa" className="bg-emerald-600 text-white p-4 rounded-lg">
          <Text className="text-xl font-bold">🔗 MSA</Text>
          <Text className="text-sm text-emerald-200">Microservices Architecture</Text>
        </Node>

        <Node id="patterns" from="msa" className="bg-emerald-50 p-3">
          <Text className="font-bold">Design Patterns</Text>
        </Node>

        <Node id="communication" from="msa" className="bg-emerald-50 p-3">
          <Text className="font-bold">Communication</Text>
        </Node>

        <Node id="observability" from="msa" className="bg-emerald-50 p-3">
          <Text className="font-bold">Observability</Text>
        </Node>

        <Node id="infrastructure" from="msa" className="bg-emerald-50 p-3">
          <Text className="font-bold">Infrastructure</Text>
        </Node>

        {/* Patterns 하위 */}
        <Node id="saga" from="patterns">Saga Pattern</Node>
        <Node id="cqrs" from="patterns">CQRS</Node>
        <Node id="eventsourcing" from="patterns">Event Sourcing</Node>
        <Node id="circuitbreaker" from="patterns">Circuit Breaker</Node>

        {/* Communication 하위 */}
        <Node id="sync" from="communication">
          <Text className="font-bold">Sync</Text>
          <Text className="text-xs text-gray-500">HTTP, gRPC</Text>
        </Node>
        <Node id="async" from="communication">
          <Text className="font-bold">Async</Text>
          <Text className="text-xs text-gray-500">Message Queue</Text>
        </Node>

        <Node id="kafka" from="async">Kafka</Node>
        <Node id="rabbitmq" from="async">RabbitMQ</Node>
        <Node id="redis-pubsub" from="async">Redis Pub/Sub</Node>

        {/* Observability 하위 */}
        <Node id="logging" from="observability">Logging</Node>
        <Node id="tracing" from="observability">Distributed Tracing</Node>
        <Node id="metrics" from="observability">Metrics</Node>

        {/* Infrastructure 하위 */}
        <Node id="apigateway" from="infrastructure">API Gateway</Node>
        <Node id="servicediscovery" from="infrastructure">Service Discovery</Node>
        <Node id="loadbalancer" from="infrastructure">Load Balancer</Node>

      </MindMap>

      {/* ===== 4. 기술 스택 연결 (Radial 레이아웃) ===== */}
      <MindMap x={900} y={550} layout="radial" spacing={100}>

        <Node id="stack" className="bg-purple-600 text-white p-4 rounded-lg">
          <Text className="text-xl font-bold">🛠️ Tech Stack</Text>
        </Node>

        <Node id="lang" from="stack">TypeScript</Node>
        <Node id="framework" from="stack">NestJS</Node>
        <Node id="orm" from="stack">TypeORM / Prisma</Node>
        <Node id="queue" from="stack">Bull Queue</Node>
        <Node id="testing" from="stack">Jest / Vitest</Node>
        <Node id="docs" from="stack">Swagger / OpenAPI</Node>

      </MindMap>

    </Canvas>
  );
}
