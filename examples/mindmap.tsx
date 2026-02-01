import { Canvas, MindMap, Node, Text, Edge } from '@graphwrite/core';

/**
 * MindMap Example - 문서 스펙에 맞춘 예제
 * 
 * 주요 특징:
 * - x, y 좌표는 MindMap 컨테이너에서만 지정
 * - Node 내부에서는 좌표 불필요 (자동 레이아웃)
 * - from으로 부모-자식 관계 정의
 * - Text children 지원
 */
export default function MindMapExample() {
  return (
    <Canvas>
      {/* Tree 레이아웃 예제 */}
      <MindMap x={100} y={100} layout="tree" spacing={60}>

        {/* 루트 노드: from이 없습니다 */}
        <Node id="root" className="bg-indigo-100 border-indigo-500 p-4">
          <Text className="text-xl font-bold text-indigo-700">서비스 구조</Text>
        </Node>

        {/* 자식 노드: from으로 부모를 지목 */}
        <Node id="auth" from="root" className="bg-rose-100 p-3">
          <Text className="font-bold">인증 모듈</Text>
          <Text className="text-sm text-gray-500">Authentication</Text>
        </Node>

        <Node id="user" from="root" className="bg-emerald-100 p-3">
          <Text className="font-bold">사용자 관리</Text>
          <Text className="text-sm text-gray-500">User Management</Text>
        </Node>

        {/* 손자 노드 */}
        <Node id="jwt" from="auth" edgeLabel="토큰 방식">
          JWT
        </Node>

        <Node id="oauth" from="auth" edgeLabel="외부 연동" edgeClassName="dashed">
          OAuth 2.0
        </Node>

        <Node id="profile" from="user">프로필</Node>
        <Node id="permissions" from="user">권한 관리</Node>

      </MindMap>

      {/* Radial 레이아웃 예제 */}
      <MindMap x={1200} y={1200} layout="radial" spacing={80}>
        <Node id="center" className="bg-purple-200 p-4">
          <Text className="font-bold text-purple-800">핵심 개념</Text>
        </Node>
        <Node id="a" from="center">개념 A</Node>
        <Node id="b" from="center">개념 B</Node>
        <Node id="c" from="center">개념 C</Node>
        <Node id="d" from="center">개념 D</Node>
      </MindMap>
    </Canvas>
  );
}
