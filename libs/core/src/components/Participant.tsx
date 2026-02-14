import * as React from 'react';
import { useNodeId } from '../hooks/useNodeId';
import { MagamError } from '../errors';

export interface ParticipantProps {
  /** 필수: 참여자의 고유 식별자 */
  id: string;
  /** 표시 텍스트 (없으면 id 사용) */
  label?: string;
  /** 스타일 (Tailwind CSS) */
  className?: string;
  children?: React.ReactNode;
  [key: string]: any;
}

export const Participant: React.FC<ParticipantProps> = (props) => {
  if (!props.id) {
    throw new MagamError(
      'Participant requires an "id" prop.',
      'props',
      'PARTICIPANT_MISSING_ID',
      'Add an id prop: <Participant id="user" />',
    );
  }
  const scopedId = useNodeId(props.id);
  return React.createElement('graph-participant', {
    ...props,
    id: scopedId,
    label: props.label ?? props.id,
  });
};
