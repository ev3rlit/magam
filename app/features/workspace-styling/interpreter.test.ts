import { describe, expect, it } from 'bun:test';
import { resolveEligibleObjectProfile } from './eligibility';
import { interpretWorkspaceStyle } from './interpreter';
import type { EligibleObjectProfile, WorkspaceStyleInput } from './types';

function makeInput(overrides?: Partial<WorkspaceStyleInput>): WorkspaceStyleInput {
  return {
    objectId: 'node-1',
    className: 'w-32 bg-slate-100 shadow-md ring-2',
    sourceRevision: 'rev-1',
    timestamp: 1_000,
    ...overrides,
  };
}

function makeEligibleProfile(overrides?: Partial<EligibleObjectProfile>): EligibleObjectProfile {
  return {
    objectId: 'node-1',
    hasClassNameSurface: true,
    supportsStylingProps: true,
    supportsSizeProps: true,
    isEligible: true,
    ...overrides,
  };
}

describe('workspace-styling/interpreter', () => {
  it('returns reset when className is empty', () => {
    const interpreted = interpretWorkspaceStyle({
      styleInput: makeInput({ className: '   ' }),
      eligibleProfile: makeEligibleProfile(),
    });

    expect(interpreted.result).toMatchObject({
      status: 'reset',
      appliedTokens: [],
      ignoredTokens: [],
    });
    expect(interpreted.diagnostics).toEqual([]);
  });

  it('returns unsupported + diagnostic for out-of-scope objects', () => {
    const profile = resolveEligibleObjectProfile({
      objectId: 'node-1',
      capabilities: {
        hasClassNameSurface: false,
        supportsStylingProps: true,
        supportsSizeProps: true,
      },
    });
    const interpreted = interpretWorkspaceStyle({
      styleInput: makeInput(),
      eligibleProfile: profile,
    });

    expect(interpreted.result.status).toBe('unsupported');
    expect(interpreted.diagnostics).toHaveLength(1);
    expect(interpreted.diagnostics[0]).toMatchObject({
      code: 'OUT_OF_SCOPE_OBJECT',
      severity: 'warning',
    });
  });

  it('applies supported category tokens and returns deterministic category order', () => {
    const interpreted = interpretWorkspaceStyle({
      styleInput: makeInput({
        className: 'ring-2 shadow-md bg-slate-100 w-32',
      }),
      eligibleProfile: makeEligibleProfile(),
    });

    expect(interpreted.result.status).toBe('applied');
    expect(interpreted.result.appliedCategories).toEqual([
      'size',
      'basic-visual',
      'shadow-elevation',
      'outline-emphasis',
    ]);
    expect(interpreted.result.appliedTokens).toEqual([
      'w-32',
      'bg-slate-100',
      'shadow-md',
      'ring-2',
    ]);
    expect(interpreted.result.resolvedStylePayload?.style).toMatchObject({
      width: '8rem',
      backgroundColor: '#f1f5f9',
    });
    expect(String(interpreted.result.resolvedStylePayload?.style.boxShadow)).toContain('#6366f1');
    expect(interpreted.diagnostics).toEqual([]);
  });

  it('supports arbitrary values for priority categories', () => {
    const interpreted = interpretWorkspaceStyle({
      styleInput: makeInput({
        className: 'w-[320px] bg-[#1f2937] border-2 border-white rounded-xl',
      }),
      eligibleProfile: makeEligibleProfile(),
    });

    expect(interpreted.result.status).toBe('applied');
    expect(interpreted.result.resolvedStylePayload?.style).toMatchObject({
      width: '320px',
      backgroundColor: '#1f2937',
      borderWidth: '2px',
      borderColor: 'white',
      borderRadius: '0.75rem',
    });
  });

  it('returns partial and mixed diagnostics for mixed input', () => {
    const interpreted = interpretWorkspaceStyle({
      styleInput: makeInput({
        className: 'w-20 foo-bar md:bg-red-100 shadow-sm',
      }),
      eligibleProfile: makeEligibleProfile(),
    });

    expect(interpreted.result.status).toBe('partial');
    expect(interpreted.result.appliedTokens).toEqual(['w-20', 'shadow-sm']);
    expect(interpreted.result.ignoredTokens).toEqual(['foo-bar', 'md:bg-red-100']);
    expect(interpreted.diagnostics.map((item) => item.code)).toEqual([
      'UNSUPPORTED_CATEGORY',
      'UNSUPPORTED_TOKEN',
      'MIXED_INPUT',
    ]);
  });

  it('returns unsupported when no token is applicable', () => {
    const interpreted = interpretWorkspaceStyle({
      styleInput: makeInput({
        className: 'foo-bar md:unknown baz',
      }),
      eligibleProfile: makeEligibleProfile(),
    });

    expect(interpreted.result.status).toBe('unsupported');
    expect(interpreted.result.appliedTokens).toEqual([]);
    expect(interpreted.result.ignoredTokens).toEqual(['foo-bar', 'md:unknown', 'baz']);
    expect(interpreted.diagnostics.length).toBeGreaterThan(0);
  });
});
