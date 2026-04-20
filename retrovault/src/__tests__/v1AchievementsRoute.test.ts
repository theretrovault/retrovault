import { beforeEach, describe, expect, it, vi } from 'vitest';

const requireApiAuthMock = vi.fn();
const apiResponseMock = vi.fn((payload: unknown) => payload);
const fetchMock = vi.fn();

vi.mock('@/lib/apiAuth', () => ({
  requireApiAuth: (...args: any[]) => requireApiAuthMock(...args),
  apiResponse: (...args: any[]) => apiResponseMock(...args),
}));

vi.mock('@/data/achievements', async () => {
  const actual = await vi.importActual<typeof import('@/data/achievements')>('@/data/achievements');
  return actual;
});

describe('/api/v1/achievements', () => {
  beforeEach(() => {
    vi.resetModules();
    requireApiAuthMock.mockReset();
    apiResponseMock.mockClear();
    fetchMock.mockReset();
    requireApiAuthMock.mockReturnValue({});
    vi.stubGlobal('fetch', fetchMock);
  });

  it('returns a bounded completion percent from unlocked vs total non-secret achievements', async () => {
    fetchMock.mockResolvedValue({
      json: async () => ({
        unlockedIds: ['c_first', 'c_10', 'setup_done'],
      }),
    });

    const { GET } = await import('@/app/api/v1/achievements/route');

    const response = await GET({
      nextUrl: { origin: 'https://retrovault.peschpit.com' },
    } as any);

    expect(response.summary.unlocked).toBe(3);
    expect(response.summary.total).toBeGreaterThan(3);
    expect(response.summary.completionPercent).toBeGreaterThanOrEqual(0);
    expect(response.summary.completionPercent).toBeLessThanOrEqual(100);
  });
});
