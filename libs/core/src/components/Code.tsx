import * as React from 'react';

export interface CodeProps {
    /** Canvas 배치 시 필수: 고유 식별자 (Edge 연결용) */
    id?: string;
    /** Canvas 배치 시 필수: X 좌표 (px) */
    x?: number;
    /** Canvas 배치 시 필수: Y 좌표 (px) */
    y?: number;
    /** 프로그래밍 언어 (json, typescript, python, sql 등). 기본값 'text' */
    language?: string;
    /** 추가 스타일 (Tailwind CSS) */
    className?: string;
    /** 표시할 코드 문자열 */
    children: string;
    [key: string]: any;
}

export const Code: React.FC<CodeProps> = ({
    language = 'text',
    ...props
}) => {
    return React.createElement('graph-code', {
        language,
        ...props,
    }, props.children);
};
