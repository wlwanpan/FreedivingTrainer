import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { detectLanguage } from './detect'

describe('detectLanguage', () => {
  it('defaults US and Canada to English', () => {
    assert.equal(detectLanguage('US', 'es'), 'en')
    assert.equal(detectLanguage('CA', 'fr'), 'en')
  })

  it('maps install country before language code', () => {
    assert.equal(detectLanguage('FR', 'en'), 'fr')
    assert.equal(detectLanguage('MX', 'en'), 'es')
    assert.equal(detectLanguage('KR', 'en'), 'ko')
    assert.equal(detectLanguage('DE', 'en'), 'de')
    assert.equal(detectLanguage('AT', 'en'), 'de')
  })

  it('falls back to the device language, then English', () => {
    assert.equal(detectLanguage('IT', 'fr'), 'fr')
    assert.equal(detectLanguage('JP', 'ja'), 'en')
    assert.equal(detectLanguage(null, null), 'en')
  })
})
