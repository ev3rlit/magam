import { Canvas, MindMap, Node, Text, Edge, Markdown } from '@graphwrite/core';

export default function BackendMindMapExample() {
    return (
        <Canvas>

            {/* ===== 1. 백엔드 기초 MindMap ===== */}
            <MindMap layout="tree">
                <Node id="nodejs">
                    <Text>Node.js</Text>
                </Node>
                <Node id="feature" from="nodejs">
                    <Markdown>{`Nodejs는 자바 스크립트 런타임임.
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

nodejs는 싱글 스레드 모델임(non bolocking)

non blocking에 요청이 들어오면 event queue에 저장하고 event loop가 싱글스레드로 요청을 처리함. 그리고 이를 worker thread로 전달하여 처리함.
이벤트 루프가 싱글스레드임에도 굉장히 빠르게 동작하는 이유는

처리 과정
1. non blocking 요청이 이벤트큐에 저장
2. 이벤트 루프에서 요청을 가져와서 처리
3. 논블로킹 요청이라면 이벤트 루프가 바로 처리
4. 블로킹 요청이라면 이벤트 루프가 기다리지 않고, worker thread로 전달
5. worker thread에서 처리 후 이벤트큐에 저장
6. 이벤트 루프에서 콜백 함수를 가져와서 처리

좋아 그렇다면  consumer 방식으로 이벤트 큐를 여러개 만들면 성능 향상이 될까?
nodejs는 의도적으로 단일 스레드 이벤트 루프 모델을 선택했음.  왜 그렇냐면 아래 3가지 핵심 문제.
1. 공유 자원 동기화 문제 - 두개의 루프가 동시에 전역변수를 수정하려하면, 경젱 상태가 발생. NodeJs의 철학은 개발자가 복잡한 멀티스레드 동기화를 신경쓰지 않고, 비즈니스 로직에만 집중
2. 문맥 교환 비용 - CPU가 여러 스레드를 번갈아가며 실행할 때 발생하는 오버헤드. 단 하나의 스레드가 멈추자 않고 게속 실행되므로 컨텍스트 스위칭 비용이 거의 없음.
3. NodeJs 뒤에서 Libuv 라이브러리가 쓰레드풀을 가지고 있음. 이벤트 루프에서 블로킹 요청이 오면 쓰레드풀에 전달하여 처리하고, 결과를 이벤트큐에 저장.
4. I/O 집약적 작업 (서버, API) 등이 있으므로 CPU 집약적 작업이 아님. 그러므로 멀티 스레드가 필요하지 않음.

그렇다면 싱글 스레드 루프의 효율성을 극한으로 올릴려고 한다면?
1. Cluster 모듈 사용 - 여러개의 프로세스를 생성하여 병렬 처리
2. Worker Thread 사용 - CPU 집약적 작업을 별도의 스레드에서 처리
3. PM2 사용 - 여러개의 프로세스를 관리하고 모니터링

HTTP 요청의 구성 요소
- URL : 요청 보내는 주소
- Method : 요청 방식 (GET, POST, PUT, DELETE 등)
- Header : 요청 헤더 (Content-Type, Authorization 등)
- Body : 요청 본문 (POST, PUT 요청 시)

                    `}</Markdown>
                </Node>

                <Node id="status-code" from="feature">
                    <Markdown>{`
상태코드(Status Code)

- 응답의 상태를 분류
- 100-599 : 응답 상태를 나타내는 세자리 숫자
- 1xx : 정보 응답
- 2xx : 성공 응답
- 3xx : 리다이렉션 응답
- 4xx : 클라이언트 오류 응답
- 5xx : 서버 오류 응답
                    `}</Markdown>
                </Node>

                <Node id="status-2xx" from="status-code">
                    <Markdown>{`
**2xx 성공 응답**

- **200 OK** : 요청이 성공적으로 처리됨. GET 요청에 대한 리소스 반환, PUT/PATCH 요청의 성공적 수정 등에 사용
- **201 Created** : 요청이 성공하여 새로운 리소스가 생성됨. POST 요청으로 새 데이터 생성 시 반환
                    `}</Markdown>
                </Node>

                <Node id="status-3xx" from="status-code">
                    <Markdown>{`
**3xx 리다이렉션 응답**

- **301 Moved Permanently** : 요청한 리소스가 영구적으로 새 URL로 이동됨. 브라우저는 자동으로 새 URL로 리다이렉트
                    `}</Markdown>
                </Node>

                <Node id="status-4xx" from="status-code">
                    <Markdown>{`
**4xx 클라이언트 오류 응답**

- **400 Bad Request** : 잘못된 요청. 클라이언트의 요청 구문이 잘못되었거나 유효하지 않은 데이터 전송
- **401 Unauthorized** : 인증 필요. 로그인이 필요하거나 인증 토큰이 유효하지 않음
- **403 Forbidden** : 접근 금지. 인증은 되었으나 해당 리소스에 대한 권한이 없음
- **404 Not Found** : 리소스를 찾을 수 없음. 요청한 URL이 존재하지 않음
- **405 Method Not Allowed** : 허용되지 않은 메서드. 해당 리소스에서 지원하지 않는 HTTP 메서드 사용
                    `}</Markdown>
                </Node>

                <Node id="status-5xx" from="status-code">
                    <Markdown>{`
**5xx 서버 오류 응답**

- **500 Internal Server Error** : 서버 내부 오류. 서버에서 예기치 않은 에러가 발생함
                    `}</Markdown>
                </Node>
            </MindMap>
        </Canvas>
    );
}
