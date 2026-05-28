(async () => {
  try {
    const url = 'http://localhost:3000/api/anthropic/generate'
    const body = { name: 'Smoke Test', inputs: { businessContext: 'smoke' } }

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    const text = await res.text()
    console.log('Status:', res.status)
    console.log('Body:')
    console.log(text)
  } catch (err) {
    console.error('Request failed:', err)
    process.exit(1)
  }
})()
