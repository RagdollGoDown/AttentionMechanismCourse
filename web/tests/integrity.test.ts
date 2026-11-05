import { describe, expect, it } from 'vitest';
import { pastedField } from '@/lib/integrity';

describe('pastedField', () => {
  it('names a text field by name, then id, then label', () => {
    expect(pastedField({ tagName: 'TEXTAREA', name: 'post-softmax', id: 'x' })).toBe('post-softmax');
    expect(pastedField({ tagName: 'TEXTAREA', name: '', id: 'remove-explain' })).toBe('remove-explain');
    expect(pastedField({ tagName: 'INPUT', name: '', id: '', getAttribute: () => 'Weight of bank' })).toBe('Weight of bank');
    expect(pastedField({ tagName: 'INPUT', name: '', id: '', getAttribute: () => null })).toBe('input');
  });

  it('ignores pastes outside text fields', () => {
    expect(pastedField({ tagName: 'DIV' })).toBeNull();
    expect(pastedField(null)).toBeNull();
  });
});
