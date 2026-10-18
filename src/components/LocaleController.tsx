import { useEffect, useState } from 'react'

type Locale = 'zh-CN' | 'zh-TW' | 'zh-HK'
const choices: Array<[Locale, string]> = [['zh-CN', '简体'], ['zh-TW', '台灣'], ['zh-HK', '香港']]
const phrases: Record<Exclude<Locale, 'zh-CN'>, Array<[string, string]>> = {
  'zh-TW': [['人工智能', '人工智慧'], ['网站', '網站'], ['程序', '程式'], ['服务器', '伺服器'], ['配置', '設定'], ['用户', '使用者'], ['信息', '資訊'], ['默认', '預設']],
  'zh-HK': [['网站', '網站'], ['程序', '程式'], ['服务器', '伺服器'], ['配置', '設定'], ['用户', '用戶'], ['信息', '資料'], ['默认', '預設']],
}

function localFallback(): Locale {
  const lang = navigator.language.toLowerCase(), zone = Intl.DateTimeFormat().resolvedOptions().timeZone
  if (lang.includes('zh-hk') || lang.includes('zh-mo') || zone === 'Asia/Hong_Kong' || zone === 'Asia/Macau') return 'zh-HK'
  if (lang.includes('zh-tw') || zone === 'Asia/Taipei') return 'zh-TW'
  return 'zh-CN'
}

export function LocaleController() {
  const [locale, setLocale] = useState<Locale>('zh-CN')
  useEffect(() => {
    let observer: MutationObserver | undefined
    const start = async () => {
      const saved = localStorage.getItem('guanxingtai-locale') as Locale | null
      let selected = saved && choices.some(([code]) => code === saved) ? saved : localFallback()
      if (!saved) { try { const r = await fetch('/api/locale', { cache: 'no-store' }); if (r.ok) selected = (await r.json()).locale } catch { /* local fallback */ } }
      setLocale(selected)
      if (selected === 'zh-CN') return
      const OpenCC = (await import('opencc-js')).default
      const converter = OpenCC.Converter({ from: 'cn', to: selected === 'zh-TW' ? 'twp' : 'hk' })
      const phrase = OpenCC.CustomConverter(phrases[selected as Exclude<Locale, 'zh-CN'>])
      const apply = () => { observer?.disconnect(); OpenCC.HTMLConverter((value: string) => phrase(converter(value)), document.documentElement, 'zh-CN', selected).convert(); observer?.observe(document.body, { childList: true, subtree: true }) }
      apply(); let timer = 0
      observer = new MutationObserver(() => { clearTimeout(timer); timer = window.setTimeout(apply, 20) }); observer.observe(document.body, { childList: true, subtree: true })
    }
    start(); return () => observer?.disconnect()
  }, [])
  const choose = (next: Locale) => { localStorage.setItem('guanxingtai-locale', next); location.reload() }
  return <div className="fixed right-3 top-20 z-[70] flex rounded-lg border border-white/10 bg-night/90 p-1 shadow-xl backdrop-blur-xl" aria-label="语言与地区">{choices.map(([value, label]) => <button key={value} onClick={() => choose(value)} className={`px-2 py-1 text-[11px] rounded ${locale === value ? 'bg-gold/20 text-gold-light' : 'text-text-muted'}`}>{label}</button>)}</div>
}

