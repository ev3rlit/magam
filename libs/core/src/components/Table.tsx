import * as React from 'react';

export interface TableProps {
    /** 테이블 제목 */
    title?: string;
    /** 테이블 데이터 배열 */
    data: Array<Record<string, any>>;
    /** 추가 스타일 (Tailwind CSS) */
    className?: string;
    [key: string]: any;
}

export const Table: React.FC<TableProps> = (props) => {
    return React.createElement('graph-table', props);
};
