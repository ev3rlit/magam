import * as React from 'react';
import { useNodeId } from '../hooks/useNodeId';
import { MagamError } from '../errors';

export interface MessageProps {
  /** 메시지 출발 참여자 id */
  from: string;
  /** 메시지 도착 참여자 id */
  to: string;
  /** 메시지 라벨 텍스트 */
  label?: string;
  /** 메시지 타입: sync(실선+채워진 화살표), async(실선+빈 화살표), reply(점선+빈 화살표), self(루프백) */
  type?: 'sync' | 'async' | 'reply' | 'self';
  /** 스타일 (Tailwind CSS) */
  className?: string;
  [key: string]: any;
}

export const Message: React.FC<MessageProps> = (props) => {
  if (!props.from) {
    throw new MagamError(
      'Message requires a "from" prop.',
      'props',
      'MESSAGE_MISSING_FROM',
      'Add a from prop: <Message from="user" to="server" />',
    );
  }
  if (!props.to) {
    throw new MagamError(
      'Message requires a "to" prop.',
      'props',
      'MESSAGE_MISSING_TO',
      'Add a to prop: <Message from="user" to="server" />',
    );
  }
  const scopedFrom = useNodeId(props.from);
  const scopedTo = useNodeId(props.to);
  return React.createElement('graph-message', {
    ...props,
    from: scopedFrom,
    to: scopedTo,
    type: props.type ?? 'sync',
  });
};
