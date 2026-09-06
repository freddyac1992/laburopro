import { appendFile, readFile } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'

export function evaluateReport(report) {
  if (!Array.isArray(report.site) || report.site.length === 0) {
    throw new Error('ZAP report contains no scanned sites')
  }

  const counts = [0, 0, 0, 0]
  for (const site of report.site) {
    if (site['@name'] !== 'http://127.0.0.1:3200' || !Array.isArray(site.alerts)) {
      throw new Error('Unexpected scan target or malformed ZAP report')
    }
    for (const alert of site.alerts) {
      const risk = String(alert.riskcode)
      if (!/^[0-3]$/.test(risk)) {
        throw new Error('Unknown ZAP risk level')
      }
      counts[Number(risk)] += 1
    }
  }

  return {
    failed: counts[3] > 0,
    summary: [
      '## DAST: ZAP passive scan',
      '',
      '| Severity | Alert types |',
      '| --- | ---: |',
      `| High (blocking) | ${counts[3]} |`,
      `| Medium (review required) | ${counts[2]} |`,
      `| Low | ${counts[1]} |`,
      `| Informational | ${counts[0]} |`,
      '',
      'Download the DAST artifact for affected URLs and remediation advice.',
      'Scope: anonymous local application with QA data. No active scan, OAuth login, production TLS or Vercel edge coverage.',
      'A passing check does not mean there are no vulnerabilities.',
      '',
    ].join('\n'),
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const report = JSON.parse(await readFile(process.argv[2], 'utf8'))
    const result = evaluateReport(report)
    console.log(result.summary)
    if (process.env.GITHUB_STEP_SUMMARY) {
      await appendFile(process.env.GITHUB_STEP_SUMMARY, result.summary)
    }
    process.exitCode = result.failed ? 1 : 0
  } catch (error) {
    console.error('DAST report validation failed:', error.message)
    process.exitCode = 1
  }
}
