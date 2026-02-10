export type Type = string;
export type Props = Record<string, any>;
export type Container = { type: 'root'; children: Instance[] };
export type Instance = { type: string; props: Props; children: Instance[] };
export type TextInstance = {
  type: 'text';
  props: { text: string };
  children: [];
};
export type PublicInstance = Instance | TextInstance;
export type HostContext = Record<string, any>;
export type UpdatePayload = any;

export const supportsMutation = true;
export const supportsPersistence = false;
export const supportsHydration = false;
export const supportsMicrotasks = true;

export function createInstance(
  type: Type,
  props: Props,
  rootContainer: Container,
  hostContext: HostContext,
  internalHandle: any,
): Instance {
  console.log('[HostConfig] createInstance', type);
  try {
    const { children, ...safeProps } = props;
    return {
      type,
      props: safeProps,
      children: [],
    };
  } catch (e) {
    console.error('[HostConfig] Error in createInstance', e);
    throw e;
  }
}

export function createTextInstance(
  text: string,
  rootContainer: Container,
  hostContext: HostContext,
  internalHandle: any,
): TextInstance {
  return {
    type: 'text',
    props: { text },
    children: [],
  };
}

export function appendInitialChild(
  parent: Instance,
  child: Instance | TextInstance,
): void {
  if (child.type === 'graph-edge' && !child.props['from']) {
    child.props = { ...child.props, from: parent.props['id'] };
  }
  if (parent.type === 'graph-group') {
    child.props = {
      ...child.props,
      parentId: parent.props['id'],
      extent: 'parent',
    };
  }
  // MindMap container: Node children are processed by layout engine
  // Keep the from prop intact for edge generation
  if (parent.type === 'graph-mindmap' && child.type === 'graph-node') {
    // Node's from prop is used by layout engine to create edges
    // No additional processing needed here
  }
  parent.children.push(child as Instance);
}

export function finalizeInitialChildren(
  instance: Instance,
  type: Type,
  props: Props,
  rootContainer: Container,
  hostContext: HostContext,
): boolean {
  return false;
}

export function prepareUpdate(
  instance: Instance,
  type: Type,
  oldProps: Props,
  newProps: Props,
  rootContainer: Container,
  hostContext: HostContext,
): UpdatePayload | null {
  return newProps;
}

export function shouldSetTextContent(type: Type, props: Props): boolean {
  return false;
}

export function getRootHostContext(rootContainer: Container): HostContext {
  return {};
}

export function getChildHostContext(
  parentHostContext: HostContext,
  type: Type,
  rootContainer: Container,
): HostContext {
  return {};
}

export function appendChild(
  parent: Instance,
  child: Instance | TextInstance,
): void {
  if (child.type === 'graph-edge' && !child.props['from']) {
    child.props = { ...child.props, from: parent.props['id'] };
  }
  if (parent.type === 'graph-group') {
    child.props = {
      ...child.props,
      parentId: parent.props['id'],
      extent: 'parent',
    };
  }
  // MindMap container: Node children are processed by layout engine
  if (parent.type === 'graph-mindmap' && child.type === 'graph-node') {
    // Node's from prop is used by layout engine to create edges
    // No additional processing needed here
  }
  parent.children.push(child as Instance);
}

export function appendChildToContainer(
  container: Container,
  child: Instance | TextInstance,
): void {
  container.children.push(child as Instance);
}

export function commitTextUpdate(
  textInstance: TextInstance,
  oldText: string,
  newText: string,
): void {
  textInstance.props.text = newText;
}

export function commitUpdate(
  instance: Instance,
  updatePayload: UpdatePayload,
  type: Type,
  oldProps: Props,
  newProps: Props,
  internalHandle: any,
): void {
  instance.props = newProps;
}

export function removeChild(
  parent: Instance,
  child: Instance | TextInstance,
): void {
  const index = parent.children.indexOf(child as Instance);
  if (index !== -1) parent.children.splice(index, 1);
}

export function removeChildFromContainer(
  container: Container,
  child: Instance | TextInstance,
): void {
  const index = container.children.indexOf(child as Instance);
  if (index !== -1) container.children.splice(index, 1);
}

export function prepareForCommit(containerInfo: Container): null {
  return null;
}
export function resetAfterCommit(containerInfo: Container): void { }
export function clearContainer(container: Container): void {
  container.children = [];
}
export function detachDeletedInstance(node: Instance): void { }

export const scheduleMicrotask = (callback: () => void) => {
  if (typeof queueMicrotask === 'function') {
    queueMicrotask(callback);
  } else {
    setTimeout(callback, 0);
  }
};

export function getCurrentEventPriority() {
  return 16;
}
export function getInstanceFromNode(node: any) {
  return null;
}
export function beforeActiveInstanceBlur() { }
export function afterActiveInstanceBlur() { }
export function preparePortalMount(containerInfo: any) { }
export function prepareScopeUpdate(scope: any, instance: any) { }
export function getInstanceFromScope(scope: any) {
  return null;
}
export function requestPaint() { }

export function resolveUpdatePriority() {
  return 16;
}
export function setCurrentUpdatePriority(priority: number) { }
export function getCurrentUpdatePriority() {
  return 16;
}
export function trackSchedulerEvent() { }
export function resolveEventType() {
  return null;
}
export function resolveEventTimeStamp() {
  return -1;
}

export function getPublicInstance(instance: Instance | TextInstance): PublicInstance {
  return instance;
}

export const isPrimaryRenderer = true;
export const warnsIfNotActing = true;

export const noTimeout = -1;
export function scheduleTimeout(fn: any, delay: number) {
  return setTimeout(fn, delay);
}
export function cancelTimeout(id: any) {
  clearTimeout(id);
}
