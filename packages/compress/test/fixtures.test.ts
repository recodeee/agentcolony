import { describe, expect, it } from 'vitest';
import { compress, countTokens } from '../src/index.js';

const corpus: Array<{ name: string; text: string }> = [
  {
    name: 'commit-message',
    text: 'Basically, this commit refactors the authentication middleware because the implementation was really getting out of hand. It should be noted that the database configuration is also updated.',
  },
  {
    name: 'stack-trace-description',
    text: 'The application throws a 500 error when the user submits the form. The middleware is catching the exception but it should be noted that we should probably also log the request.',
  },
  {
    name: 'review-comment',
    text: 'Please note that the function signature is kind of misleading. I think we should rename the variable because actually the configuration is the real issue.',
  },
  {
    name: 'readme-excerpt',
    text: 'The documentation describes the configuration in the repository. The dependencies are installed in the directory. Note that the environment variables are loaded from the .env file.',
  },
];

describe('benchmark corpus', () => {
  it('average compression ≥ 30% (lenient)', () => {
    let before = 0;
    let after = 0;
    for (const c of corpus) {
      before += countTokens(c.text);
      after += countTokens(compress(c.text, { intensity: 'full' }));
    }
    const ratio = 1 - after / before;
    expect(ratio).toBeGreaterThan(0.3);
  });
});
