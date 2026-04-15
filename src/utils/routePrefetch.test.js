import { describe, it, expect } from 'vitest';
import { prefetchPublicRoute } from './routePrefetch';

describe('prefetchPublicRoute', () => {
  it('ignore les chemins invalides', () => {
    expect(() => prefetchPublicRoute(null)).not.toThrow();
    expect(() => prefetchPublicRoute(undefined)).not.toThrow();
    expect(() => prefetchPublicRoute('')).not.toThrow();
  });

  it('déclenche un import dynamique pour une route publique connue', async () => {
    await expect(prefetchPublicRoute('/apropos')).resolves.toBeDefined();
    await expect(prefetchPublicRoute('/info/foo')).resolves.toBeDefined();
  });
});
