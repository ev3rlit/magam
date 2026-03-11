# Compact Dense Backlog

## 배경

`compact` dense 레이아웃은 4방향 fan-out과 contour 압축으로 밀도를 크게 개선했지만, 루트 주변 sector 충돌과 corridor 점유 문제는 데이터 분포에 따라 다시 나타날 수 있습니다.

최근에는 북쪽 subtree가 동쪽 corridor를 과도하게 점유하면서, 오른쪽 sector가 루트에서 멀어지는 문제가 확인되었습니다. 이 문제는 이번 작업에서 `북/남 sector 내부 x-anchor 최적화`로 1차 해결했습니다.

다만 아래 항목들은 추후 레이아웃 품질을 더 끌어올리기 위한 후속 백로그로 유지합니다.

## 현재 적용된 해결

### 1) 북/남 sector 내부 x-anchor 최적화

현재 구현에는 이미 이 접근이 일부 반영되어 있습니다.

- `up/down` sector의 child 배치를 subtree 전체 폭이 아니라 root box 기준으로 먼저 정렬한다.
- subtree의 비대칭 contour는 작은 bias로만 반영한다.
- 목표는 북쪽 subtree 하나가 `NE corridor` 전체를 선점하지 못하게 하는 것이다.

이 접근은 현재 문제를 해결하는 데 효과적이었고, 앞으로도 `compact` dense의 기본 보정 규칙으로 유지합니다.

## 추후 백로그

### 1) 방향 할당에 corner occupancy penalty 추가

루트의 1차 child를 `up/right/down/left`로 배정할 때, 단순 count/load 균형만 보지 않고 corner 점유 비용도 함께 평가하는 방식입니다.

- 예: 어떤 subtree를 `up`에 놓았을 때 `NE corridor`를 크게 막는다면 penalty를 준다.
- 목표: 문제가 생긴 뒤 sector를 밀어내는 것이 아니라, 처음부터 더 좋은 방향에 배치한다.
- 기대 효과: `Data Platform` 같은 subtree가 북동 corridor를 독점하는 상황을 줄일 수 있다.

이 작업은 현재 분배 로직의 scoring을 확장하는 성격이므로, 다음 단계의 우선 후보입니다.

### 2) 4방향 안에서 8방향 느낌의 sub-lane 사용

레이아웃 모드를 늘리지 않고, 각 cardinal sector 내부에 추가 lane 개념을 두는 방식입니다.

- `up` 안에서 `NW`, `NE`
- `down` 안에서 `SW`, `SE`

목표는 북/남 sector가 한 줄처럼 동서 전체를 점유하지 않고, 코너별로 더 자연스럽게 분산되도록 만드는 것입니다.

- 기대 효과: 루트 주변이 더 사각형에 가깝고 조밀하게 보인다.
- 장점: 기존 4방향 mental model은 유지된다.
- 위험: lane 선택 규칙이 복잡해지면 안정성이 떨어질 수 있다.

루트 child 수가 많고 sector 내부 폭 편차가 큰 fixture에서 검토 가치가 높습니다.

### 3) 루트 근처만 hard, 멀어질수록 soft

루트 근처에서는 sector separation을 강하게 유지하고, 루트에서 멀어질수록 다른 sector와의 가로/세로 점유를 조금 더 허용하는 방식입니다.

- root child 박스 주변은 엄격하게 보호한다.
- 그보다 바깥 subtree contour는 좀 더 유연하게 허용한다.

목표는 루트 주변의 방향성과 가독성은 지키되, 바깥으로 갈수록 과도한 corridor 비우기로 인한 dead space를 줄이는 것입니다.

- 기대 효과: 중앙은 정돈되고, 외곽은 더 조밀해질 수 있다.
- 위험: sector 경계가 너무 느슨해지면 다시 edge 시각 충돌이나 응집도 저하가 생길 수 있다.

이 항목은 x-anchor 최적화만으로 한계가 보일 때 검토합니다.

## 적용 판단 기준

아래 상황이 다시 반복되면 본 백로그를 재검토합니다.

- 특정 `up/down` subtree 때문에 `left/right` sector가 루트에서 과도하게 밀려난다.
- 4방향 분포는 맞지만, 특정 corner만 반복적으로 비거나 막힌다.
- root 주변은 안정적인데 외곽 dead space가 다시 크게 보인다.
- stress fixture에서 overlap은 없지만 시각 밀도가 떨어진다.

## 우선순위

현재 추천 순서는 다음과 같습니다.

1. 방향 할당에 corner occupancy penalty 추가
2. 4방향 안에서 8방향 느낌의 sub-lane 사용
3. 루트 근처만 hard, 멀어질수록 soft

즉, 다음 개선은 `배치 후 보정`보다 `초기 방향 선택을 더 똑똑하게 만드는 것`에서 시작하는 것이 가장 적절합니다.
