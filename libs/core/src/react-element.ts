const REACT_ELEMENT_TYPE = Symbol.for('react.element');

export function createCompatElement(
  type: unknown,
  props: Record<string, unknown> | null = null,
  ...children: unknown[]
): {
  $$typeof: symbol;
  type: unknown;
  key: string | null;
  ref: unknown;
  props: Record<string, unknown>;
  _owner: null;
} {
  const nextProps = props ? { ...props } : {};
  const keyValue = nextProps['key'];
  const refValue = nextProps['ref'];
  const key = keyValue === undefined ? null : String(keyValue);
  const ref = refValue === undefined ? null : refValue;

  delete nextProps['key'];
  delete nextProps['ref'];

  if (children.length === 1) {
    nextProps['children'] = children[0];
  } else if (children.length > 1) {
    nextProps['children'] = children;
  }

  return {
    $$typeof: REACT_ELEMENT_TYPE,
    type,
    key,
    ref,
    props: nextProps,
    _owner: null,
  };
}
