export function exportStrategy({ name, values, aiOutput }) {
  const sections = [
    `NIMBLSCALE STRATEGY EXPORT`,
    `Generated: ${new Date().toLocaleString()}`,
    `Draft: ${name || 'Untitled'}`,
    `${'─'.repeat(60)}`,
    ``,
    `BUSINESS CONTEXT`,
    values.businessContext || '(not filled)',
    ``,
    `COMPETITIVE ADVANTAGE`,
    values.competitiveAdvantage || '(not filled)',
    ``,
    `TARGET AUDIENCE`,
    values.targetAudience || '(not filled)',
    ``,
    `STRATEGIC INITIATIVES`,
    values.initiatives || '(not filled)',
    ``,
    `METRICS & OUTCOMES`,
    values.metrics || '(not filled)',
  ]

  if (aiOutput) {
    sections.push(``, `${'─'.repeat(60)}`, ``, `AI-GENERATED STRATEGY SUMMARY`, ``, aiOutput)
  }

  const text = sections.join('\n')
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${(name || 'strategy').replace(/[^a-z0-9]/gi, '_').toLowerCase()}_nimblscale.txt`
  a.click()
  URL.revokeObjectURL(url)
}
