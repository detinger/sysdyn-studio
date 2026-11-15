import { describe, it, expect } from 'vitest';
import { renameInEquation } from '../../src/domain/equations/rename.js';

describe('renameInEquation', () => {
  it('renames whole identifiers only and keeps formatting', () => {
    expect(renameInEquation('Population*birth_rate + Population_2', 'Population', 'Pop').text).toBe('Pop*birth_rate + Population_2');
  });
  it('does not touch function names', () => {
    expect(renameInEquation('max(0, max - 1)', 'max', 'cap').text).toBe('max(0, cap - 1)');
  });
  it('leaves equations without the symbol unchanged', () => {
    expect(renameInEquation('a + b', 'c', 'd')).toEqual({ text: 'a + b', changed: false, ok: true });
  });
  it('refuses a rename that would change the meaning', () => {
    const r = renameInEquation('a + b', 'a', 'b');
    expect(r.ok).toBe(false);
    expect(r.text).toBe('a + b');
  });
});
