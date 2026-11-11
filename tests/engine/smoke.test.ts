import { describe, expect, it } from 'vitest';
import type { Format } from '@/engine/types';

describe('scaffold', () => {
  it('runs tests and resolves the @ alias', () => {
    const format: Format = 'standard-bo1';
    expect(format).toBe('standard-bo1');
    expect(1 + 1).toBe(2);
  });
});
