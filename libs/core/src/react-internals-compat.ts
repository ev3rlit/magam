interface ReactLikeRecord extends Record<string, unknown> {
  default?: Record<string, unknown>;
}

const LEGACY_INTERNALS_KEY = '__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED';
const CLIENT_INTERNALS_KEY = '__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE';

export function ensureReactInternalsCompat(reactNamespace: Record<string, unknown>): void {
  const reactRecord = reactNamespace as ReactLikeRecord;
  const defaultReact = asRecord(reactRecord.default);
  const legacyInternals = readRecord(reactRecord, LEGACY_INTERNALS_KEY) ?? readRecord(defaultReact, LEGACY_INTERNALS_KEY);

  if (legacyInternals) {
    assignLegacyInternals(reactRecord, legacyInternals);

    if (defaultReact) {
      assignLegacyInternals(defaultReact, legacyInternals);
    }

    return;
  }

  const clientInternals =
    readRecord(reactRecord, CLIENT_INTERNALS_KEY) ?? readRecord(defaultReact, CLIENT_INTERNALS_KEY);

  if (!clientInternals) {
    return;
  }

  const currentOwner = { current: null as unknown };
  const actQueueState = createProxyHolder(clientInternals, 'actQueue');

  actQueueState['isBatchingLegacy'] = false;
  actQueueState['didScheduleLegacyUpdate'] = false;

  const legacyShape = {
    ReactCurrentDispatcher: createProxyHolder(clientInternals, 'H'),
    ReactCurrentBatchConfig: createProxyHolder(clientInternals, 'T', 'transition'),
    ReactCurrentOwner: currentOwner,
    ReactDebugCurrentFrame: {
      setExtraStackFrame() {},
      getCurrentStack: null,
      getStackAddendum() {
        return '';
      },
    },
    ReactCurrentActQueue: actQueueState,
  };

  assignLegacyInternals(reactRecord, legacyShape);

  if (defaultReact) {
    assignLegacyInternals(defaultReact, legacyShape);
  }
}

function assignLegacyInternals(
  target: Record<string, unknown>,
  legacyInternals: Record<string, unknown>,
): void {
  const existingDescriptor = Object.getOwnPropertyDescriptor(target, LEGACY_INTERNALS_KEY);

  if (existingDescriptor) {
    return;
  }

  if (!Object.isExtensible(target)) {
    return;
  }

  Object.defineProperty(target, LEGACY_INTERNALS_KEY, {
    configurable: true,
    value: legacyInternals,
  });
}

function readRecord(
  target: Record<string, unknown> | null,
  key: string,
): Record<string, unknown> | null {
  if (!target) {
    return null;
  }

  return asRecord(target[key]);
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : null;
}

function createProxyHolder(
  target: Record<string, unknown>,
  targetKey: string,
  legacyKey: string = 'current',
): Record<string, unknown> {
  const holder: Record<string, unknown> = {};

  Object.defineProperty(holder, legacyKey, {
    configurable: true,
    get() {
      return target[targetKey] ?? null;
    },
    set(value: unknown) {
      target[targetKey] = value;
    },
  });

  return holder;
}
