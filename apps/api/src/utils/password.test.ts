import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { getPasswordError, isPasswordValid, PASSWORD_RULES } from './password.js';

describe('password policy', () => {
  it('rejects passwords shorter than 8 characters', () => {
    assert.match(getPasswordError('Ab1') ?? '', /at least 8 characters/);
    assert.equal(isPasswordValid('Ab1'), false);
  });

  it('requires an uppercase letter', () => {
    assert.match(getPasswordError('abcdefg1') ?? '', /uppercase/);
  });

  it('requires a lowercase letter', () => {
    assert.match(getPasswordError('ABCDEFG1') ?? '', /lowercase/);
  });

  it('requires a number', () => {
    assert.match(getPasswordError('Abcdefgh') ?? '', /number/);
  });

  it('accepts a compliant password', () => {
    assert.equal(getPasswordError('Passw0rd'), null);
    assert.equal(isPasswordValid('Passw0rd'), true);
  });

  it('exposes rules that agree with the aggregate validator', () => {
    const good = 'Str0ngPass';
    assert.ok(PASSWORD_RULES.every((rule) => rule.test(good)));
    assert.equal(isPasswordValid(good), true);

    const bad = 'weak';
    assert.ok(PASSWORD_RULES.some((rule) => !rule.test(bad)));
    assert.equal(isPasswordValid(bad), false);
  });
});
