import { Canvas, MindMap, Node, Text, Edge } from '@graphwrite/core';

export default function BackendMindMapExample() {
    return (
        <Canvas>

            {/* ===== 1. 백엔드 기초 MindMap ===== */}
            <MindMap layout="tree">
                <Node id="nodejs">
                    <Text>Node.js</Text>
                </Node>
                <Node id="feature" from="nodejs">
                    <Text>Feature</Text>
                </Node>
                Nodejs는 자바 스크립트 런타임임.
                nodejs는 왜 생겨나게 된건가?  2009년 npm(node pacakge manger)가 출시. 2010년 socketio와 express가 출시. 2011년  uber/linkedin/netflix 등에서 nodejs를 사용하기 시작. npm 1.0 출시.
                2020년 github npm 인수.
                자바크스크립트 엔진은 다양하게 존재 v8, spiderMonkey, safari 등이 있음.  v8은 구글에서 개발한 자바크스크립트 엔진으로 크롬과 nodejs에서 사용됨.  spiderMonkey는 파이어폭스에서 사용됨. safari는 애플에서 개발한 자바크스크립트 엔진으로 사파리에서 사용됨.
                nodejs는 v8을 기반으로 만들어짐.

                V8 Just In Time Compilation(JIT)
                - 컴파일과 인터프리터의 장점을 결합한 방식. 최적화가 가능한곳에서 컴파일을 진행하여 성능을 향상시킴.
                - 그렇지 않으면 인터프리터로 실행하여 성능을 향상시킴.

                1. 코드실핸 환경 준비하기
                2. 컴파일
                3. 바이트 코드 생성
                4. Interpret + 실행(바이트코드)
                5. 컴파일
            </MindMap>
        </Canvas>
    );
}
