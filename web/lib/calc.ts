/**
 * The compute step's calculator: + − × ÷ ^, brackets, exp(x), sqrt(x) and the constant e.
 * A small recursive-descent parser, so learner input is never run as code. Unreadable → null.
 */
export function evaluate(input: string): number | null {
  if (/\d\s+[\d.]/.test(input)) return null; // "8 34" is a typo, not 834
  const src = input
    .replace(/\s+/g, '')
    .replace(/,/g, '.')
    .replace(/[×·]/g, '*')
    .replace(/÷/g, '/')
    .replace(/[−–]/g, '-')
    .replace(/√/g, 'sqrt')
    .replace(/eˣ/g, 'exp');
  let i = 0;

  const peek = () => src[i];
  const eat = (c: string) => (src[i] === c ? (i++, true) : false);

  // sum := product (('+' | '-') product)*
  function sum(): number {
    let v = product();
    for (;;) {
      if (eat('+')) v += product();
      else if (eat('-')) v -= product();
      else return v;
    }
  }
  // product := power (('*' | '/') power)*
  function product(): number {
    let v = power();
    for (;;) {
      if (eat('*')) v *= power();
      else if (eat('/')) v /= power();
      else return v;
    }
  }
  // power := unary ('^' power)?   (right-associative)
  function power(): number {
    const base = unary();
    return eat('^') ? base ** power() : base;
  }
  // unary := '-' unary | atom
  function unary(): number {
    return eat('-') ? -unary() : atom();
  }
  // atom := number | 'e' | ('exp' | 'sqrt') '(' sum ')' | '(' sum ')'
  function atom(): number {
    const num = /^\d*\.?\d+/.exec(src.slice(i));
    if (num) {
      i += num[0].length;
      return Number(num[0]);
    }
    for (const [name, fn] of [['exp', Math.exp], ['sqrt', Math.sqrt]] as const) {
      if (src.startsWith(name, i)) {
        i += name.length;
        return fn(group());
      }
    }
    if (eat('e')) return Math.E;
    return group();
  }
  function group(): number {
    if (!eat('(')) throw new Error(`unexpected ${peek() ?? 'end'}`);
    const v = sum();
    if (!eat(')')) throw new Error('missing )');
    return v;
  }

  if (src === '') return null;
  try {
    const v = sum();
    return i === src.length && Number.isFinite(v) ? v : null;
  } catch {
    return null;
  }
}
