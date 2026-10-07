import { describe, expect, it } from 'vitest';
import { parseCondition, parseDebug, parsePid } from '@/lib/condition';

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

describe('parsePid', () => {
  it.each([
    ['P07', 'P07'],
    [' p-07_a ', 'p-07_a'],
    [['P01', 'P02'], 'P01'],
    ['', null],
    ['P 07', null],
    ['../etc', null],
    ['x'.repeat(41), null],
    [undefined, null],
  ] as const)('%j → %j', (input, expected) => expect(parsePid(input)).toBe(expected));
});
