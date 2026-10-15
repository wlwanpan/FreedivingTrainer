import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { nestedKeys } from './translate'
import { Languages } from './languages'
import de from './locales/de.json'
import en from './locales/en.json'
import es from './locales/es.json'
import fr from './locales/fr.json'
import ko from './locales/ko.json'
import { sessionDisplayName } from './labels'
import { translate } from './translate'

const catalogs = { en, fr, es, ko, de }

describe('locale catalogs', () => {
  it('keeps the same keys in every language file', () => {
    const expected = nestedKeys(en)
    assert.ok(expected.length > 0)
    for (const language of Languages) {
      assert.deepEqual(nestedKeys(catalogs[language]), expected, language)
    }
  })

  it('interpolates placeholders and falls back to English', () => {
    assert.equal(translate('en', 'home.hold', { time: '1:00' }), 'Hold 1:00')
    assert.equal(translate('fr', 'common.start'), 'Démarrer')
    assert.equal(translate('de', 'missing.key'), 'missing.key')
  })

  it('translates stored session names at display time', () => {
    const t = (key: string) => translate('es', key)
    assert.equal(sessionDisplayName('CO2 1', t), translate('es', 'plan.session.co21'))
    assert.equal(sessionDisplayName('One breath', t), translate('es', 'tables.oneBreath'))
    assert.equal(sessionDisplayName('Custom name', t), 'Custom name')
  })
})
