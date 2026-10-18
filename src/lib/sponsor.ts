export function promptSponsor() {
  const key = 'guanxingtai-sponsor-shown-at'
  try {
    const last = Number(localStorage.getItem(key) || 0)
    if (Date.now() - last < 24 * 60 * 60 * 1000) return
    localStorage.setItem(key, String(Date.now()))
  } catch { /* privacy mode: still allow the prompt */ }
  window.setTimeout(() => window.dispatchEvent(new Event('guanxingtai-sponsor-prompt')), 1200)
}
