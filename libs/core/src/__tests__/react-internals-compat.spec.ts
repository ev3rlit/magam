import { ensureReactInternalsCompat } from '../react-internals-compat';

describe('ensureReactInternalsCompat', () => {
  it('hydrates legacy internals from client internals and mirrors them to the default export', () => {
    const defaultReact: Record<string, unknown> = {};
    const reactNamespace: Record<string, unknown> = {
      default: defaultReact,
      __CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE: {
        H: { current: 'dispatcher' },
        T: { lane: 'transition' },
        actQueue: ['queued'],
      },
    };

    ensureReactInternalsCompat(reactNamespace);

    const legacyInternals =
      reactNamespace.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED as Record<string, unknown>;

    expect((legacyInternals.ReactCurrentDispatcher as { current: unknown }).current).toEqual({
      current: 'dispatcher',
    });
    expect((legacyInternals.ReactCurrentBatchConfig as { transition: unknown }).transition).toEqual({
      lane: 'transition',
    });
    expect((legacyInternals.ReactCurrentOwner as { current: unknown }).current).toBeNull();
    expect((legacyInternals.ReactCurrentActQueue as { current: unknown }).current).toEqual(['queued']);
    expect(
      (legacyInternals.ReactCurrentActQueue as { isBatchingLegacy: boolean }).isBatchingLegacy,
    ).toBeFalse();
    expect(
      (legacyInternals.ReactCurrentActQueue as { didScheduleLegacyUpdate: boolean })
        .didScheduleLegacyUpdate,
    ).toBeFalse();
    expect(defaultReact.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED).toBe(
      reactNamespace.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED,
    );
  });
});
