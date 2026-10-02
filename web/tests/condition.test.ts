import { describe, expect, it } from 'vitest';
import { parseCondition, parseDebug } from '@/lib/condition';

describe('parseCondition', () => {
  it.each([
    ['control', 'control'],
    ['CONTROL', 'control'],
    [' control ', 'control'],
    ['ai', 'ai'],
    ['foo', 'ai'],
    ['', 'ai'],
    [undefined, 'ai'],
    [null, 'ai'],
  ] as const)('%j → %s', (input, expected) => expect(parseCondition(input)).toBe(expected));
  it('uses the first value of a repeated parameter', () => {
    expect(parseCondition(['control', 'ai'])).toBe('control');
  });
});

describe('parseDebug', () => {
  it.each([
    ['', true], // bare ?debug
    ['anything', true],
    [['', ''], true], // ?debug&debug
    [undefined, false],
    [null, false],
  ] as const)('%j → %s', (input, expected) => expect(parseDebug(input)).toBe(expected));
});
