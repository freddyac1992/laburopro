import assert from 'node:assert/strict'
import test from 'node:test'
import { evaluateReport } from './dast-report.mjs'

function report(...risks) {
  return { site: [{ '@name': 'http://127.0.0.1:3200', alerts: risks.map(riskcode => ({ riskcode })) }] }
}

test('high severity findings fail the gate', () => {
  assert.equal(evaluateReport(report('3')).failed, true)
})

test('medium and lower findings remain visible without failing the initial gate', () => {
  const result = evaluateReport(report('0', '1', '2', '2'))
  assert.equal(result.failed, false)
  assert.match(result.summary, /Medium \(review required\) \| 2/)
})

test('a valid report without alerts passes', () => {
  assert.equal(evaluateReport(report()).failed, false)
})

test('empty, malformed and out-of-scope reports fail closed', () => {
  for (const invalid of [{}, { site: [] }, { site: [{}] }, report('4'), report(null), report('')]) {
    assert.throws(() => evaluateReport(invalid))
  }
  const external = report('1')
  external.site[0]['@name'] = 'https://www.laburopro.com'
  assert.throws(() => evaluateReport(external))
})
