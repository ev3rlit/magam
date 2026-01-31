import { MindMap, Node, Text } from '@graphwrite/core';

export default function KubernetesMindMap() {
    return (
        <MindMap x={50} y={300} layout="tree" spacing={40}>
            {/* 루트: Kubernetes */}
            <Node id="k8s">
                <Text bold fontSize={18}>Kubernetes (K8s)</Text>
                <Text>컨테이너 오케스트레이션 플랫폼</Text>
            </Node>

            {/* ========== 1. 개요 ========== */}
            <Node id="overview" from="k8s" edgeLabel="개요">
                <Text bold>Kubernetes란?</Text>
            </Node>
            <Node id="overview-def" from="overview">
                <Text>Google이 개발한 오픈소스</Text>
                <Text>컨테이너화된 애플리케이션의</Text>
                <Text>배포, 확장, 관리 자동화 플랫폼</Text>
            </Node>
            <Node id="overview-meaning" from="overview">
                <Text>K8s: K와 s 사이 8글자</Text>
                <Text>(ubernete)</Text>
            </Node>

            {/* ========== 2. 핵심 특징 ========== */}
            <Node id="features" from="k8s" edgeLabel="핵심 특징">
                <Text bold>Features</Text>
            </Node>
            <Node id="feat-auto-healing" from="features">
                <Text bold>자동 복구 (Self-Healing)</Text>
                <Text>장애 컨테이너 자동 재시작</Text>
            </Node>
            <Node id="feat-scaling" from="features">
                <Text bold>자동 스케일링</Text>
                <Text>HPA/VPA로 부하 대응</Text>
            </Node>
            <Node id="feat-rollout" from="features">
                <Text bold>롤링 업데이트</Text>
                <Text>무중단 배포 지원</Text>
            </Node>
            <Node id="feat-service-discovery" from="features">
                <Text bold>서비스 디스커버리</Text>
                <Text>DNS 기반 서비스 탐색</Text>
            </Node>
            <Node id="feat-lb" from="features">
                <Text bold>로드 밸런싱</Text>
                <Text>트래픽 자동 분산</Text>
            </Node>
            <Node id="feat-declarative" from="features">
                <Text bold>선언적 구성</Text>
                <Text>YAML로 인프라 정의</Text>
            </Node>

            {/* ========== 3. 주요 용어 ========== */}
            <Node id="terms" from="k8s" edgeLabel="주요 용어">
                <Text bold>Key Concepts</Text>
            </Node>

            {/* Pod */}
            <Node id="term-pod" from="terms">
                <Text bold>Pod</Text>
            </Node>
            <Node id="term-pod-detail" from="term-pod">
                <Text>K8s의 최소 배포 단위</Text>
                <Text>1개 이상의 컨테이너 그룹</Text>
                <Text>동일 네트워크/스토리지 공유</Text>
            </Node>

            {/* Deployment */}
            <Node id="term-deploy" from="terms">
                <Text bold>Deployment</Text>
            </Node>
            <Node id="term-deploy-detail" from="term-deploy">
                <Text>Pod의 선언적 업데이트 관리</Text>
                <Text>ReplicaSet 자동 생성</Text>
                <Text>롤링 업데이트/롤백 지원</Text>
            </Node>

            {/* Service */}
            <Node id="term-svc" from="terms">
                <Text bold>Service</Text>
            </Node>
            <Node id="term-svc-detail" from="term-svc">
                <Text>Pod에 대한 네트워크 추상화</Text>
                <Text>ClusterIP, NodePort, LoadBalancer</Text>
                <Text>안정적인 엔드포인트 제공</Text>
            </Node>

            {/* ConfigMap & Secret */}
            <Node id="term-config" from="terms">
                <Text bold>ConfigMap / Secret</Text>
            </Node>
            <Node id="term-config-detail" from="term-config">
                <Text>설정 데이터 외부화</Text>
                <Text>Secret: Base64 인코딩 민감정보</Text>
                <Text>컨테이너와 설정 분리</Text>
            </Node>

            {/* Ingress */}
            <Node id="term-ingress" from="terms">
                <Text bold>Ingress</Text>
            </Node>
            <Node id="term-ingress-detail" from="term-ingress">
                <Text>HTTP/HTTPS 라우팅 규칙</Text>
                <Text>도메인 기반 트래픽 분배</Text>
                <Text>SSL/TLS 종료 처리</Text>
            </Node>

            {/* Namespace */}
            <Node id="term-ns" from="terms">
                <Text bold>Namespace</Text>
            </Node>
            <Node id="term-ns-detail" from="term-ns">
                <Text>클러스터 내 가상 분리</Text>
                <Text>리소스 격리 및 권한 관리</Text>
                <Text>멀티 테넌시 지원</Text>
            </Node>

            {/* ========== 4. 아키텍처 ========== */}
            <Node id="arch" from="k8s" edgeLabel="아키텍처">
                <Text bold>Architecture</Text>
            </Node>
            <Node id="arch-master" from="arch">
                <Text bold>Control Plane</Text>
            </Node>
            <Node id="arch-api" from="arch-master">
                <Text>API Server</Text>
                <Text>모든 통신의 중심</Text>
            </Node>
            <Node id="arch-etcd" from="arch-master">
                <Text>etcd</Text>
                <Text>클러스터 상태 저장소</Text>
            </Node>
            <Node id="arch-scheduler" from="arch-master">
                <Text>Scheduler</Text>
                <Text>Pod 배치 결정</Text>
            </Node>
            <Node id="arch-cm" from="arch-master">
                <Text>Controller Manager</Text>
                <Text>상태 조정 루프 실행</Text>
            </Node>

            <Node id="arch-worker" from="arch">
                <Text bold>Worker Node</Text>
            </Node>
            <Node id="arch-kubelet" from="arch-worker">
                <Text>kubelet</Text>
                <Text>노드 에이전트</Text>
            </Node>
            <Node id="arch-proxy" from="arch-worker">
                <Text>kube-proxy</Text>
                <Text>네트워크 프록시</Text>
            </Node>
            <Node id="arch-runtime" from="arch-worker">
                <Text>Container Runtime</Text>
                <Text>containerd, CRI-O</Text>
            </Node>

            {/* ========== 5. 활용 방법 ========== */}
            <Node id="usecases" from="k8s" edgeLabel="활용 방법">
                <Text bold>Use Cases</Text>
            </Node>
            <Node id="use-msa" from="usecases">
                <Text bold>마이크로서비스</Text>
                <Text>독립적 서비스 배포/확장</Text>
            </Node>
            <Node id="use-cicd" from="usecases">
                <Text bold>CI/CD 파이프라인</Text>
                <Text>GitOps 기반 자동 배포</Text>
            </Node>
            <Node id="use-ml" from="usecases">
                <Text bold>ML/AI 워크로드</Text>
                <Text>GPU 스케줄링 지원</Text>
            </Node>
            <Node id="use-hybrid" from="usecases">
                <Text bold>하이브리드 클라우드</Text>
                <Text>멀티 클라우드 운영</Text>
            </Node>
            <Node id="use-edge" from="usecases">
                <Text bold>엣지 컴퓨팅</Text>
                <Text>K3s, MicroK8s 활용</Text>
            </Node>

            {/* ========== 6. 생태계 ========== */}
            <Node id="ecosystem" from="k8s" edgeLabel="생태계">
                <Text bold>Ecosystem</Text>
            </Node>
            <Node id="eco-helm" from="ecosystem">
                <Text bold>Helm</Text>
                <Text>패키지 매니저</Text>
            </Node>
            <Node id="eco-istio" from="ecosystem">
                <Text bold>Istio</Text>
                <Text>서비스 메시</Text>
            </Node>
            <Node id="eco-prometheus" from="ecosystem">
                <Text bold>Prometheus</Text>
                <Text>모니터링</Text>
            </Node>
            <Node id="eco-argocd" from="ecosystem">
                <Text bold>ArgoCD</Text>
                <Text>GitOps CD</Text>
            </Node>
            <Node id="eco-tekton" from="ecosystem">
                <Text bold>Tekton</Text>
                <Text>클라우드 네이티브 CI/CD</Text>
            </Node>
            <Node id="eco-keda" from="ecosystem">
                <Text bold>KEDA</Text>
                <Text>이벤트 기반 오토스케일링</Text>
            </Node>

            {/* ========== 7. 장단점 ========== */}
            <Node id="proscons" from="k8s" edgeLabel="장단점">
                <Text bold>Pros & Cons</Text>
            </Node>

            {/* 장점 */}
            <Node id="pros" from="proscons">
                <Text bold>✅ 장점</Text>
            </Node>
            <Node id="pro-1" from="pros">
                <Text>높은 가용성 보장</Text>
            </Node>
            <Node id="pro-2" from="pros">
                <Text>인프라 자동화</Text>
            </Node>
            <Node id="pro-3" from="pros">
                <Text>벤더 락인 방지</Text>
            </Node>
            <Node id="pro-4" from="pros">
                <Text>활발한 커뮤니티</Text>
            </Node>
            <Node id="pro-5" from="pros">
                <Text>선언적 인프라 관리</Text>
            </Node>

            {/* 단점 */}
            <Node id="cons" from="proscons">
                <Text bold>❌ 단점</Text>
            </Node>
            <Node id="con-1" from="cons">
                <Text>높은 학습 곡선</Text>
            </Node>
            <Node id="con-2" from="cons">
                <Text>복잡한 초기 설정</Text>
            </Node>
            <Node id="con-3" from="cons">
                <Text>리소스 오버헤드</Text>
            </Node>
            <Node id="con-4" from="cons">
                <Text>디버깅 난이도</Text>
            </Node>
            <Node id="con-5" from="cons">
                <Text>소규모 프로젝트에 과함</Text>
            </Node>
        </MindMap>
    );
}
