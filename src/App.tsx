/* ============================================================
   紫微斗数 App - 主入口
   高级玻璃态设计 + 精致导航交互
   ============================================================ */

import { useEffect, useState, type ReactNode } from 'react'
import { BirthForm } from '@/components/BirthForm'
import { ChartDisplay } from '@/components/chart'
import { AIInterpretation } from '@/components/AIInterpretation'
import { SettingsPanel } from '@/components/SettingsPanel'
import { YearlyFortune } from '@/components/fortune'
import { LifeKLine } from '@/components/kline'
import { KLineIcon } from '@/components/icons/KLineIcon'
import { MatchAnalysis } from '@/components/match'
import { GitHubLinkButton, OpenSourceFooterLinks } from '@/components/OpenSourceLinks'
import { ShareCard } from '@/components/share'
import { LocaleController } from '@/components/LocaleController'
import { useChartStore } from '@/stores'

type TabType = 'chart' | 'fortune' | 'kline' | 'match' | 'share'

const TABS: Array<{ key: TabType; label: string; icon: ReactNode }> = [
  { key: 'chart', label: '命盘解读', icon: '☰' },
  { key: 'fortune', label: '年度运势', icon: '◎' },
  { key: 'kline', label: '人生K线', icon: <KLineIcon className="h-4 w-4" /> },
  { key: 'match', label: '双人合盘', icon: '⚭' },
  { key: 'share', label: '分享卡片', icon: '◈' },
]

export default function App() {
  const { chart } = useChartStore()
  const [showSettings, setShowSettings] = useState(false)
  const [showSponsor, setShowSponsor] = useState(false)
  const [sponsorAmount, setSponsorAmount] = useState('19.9')
  const [activeTab, setActiveTab] = useState<TabType>('chart')

  useEffect(() => {
    if (!chart) return
    const warnBeforeClose = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', warnBeforeClose)
    return () => window.removeEventListener('beforeunload', warnBeforeClose)
  }, [chart])

  useEffect(() => {
    const show = () => setShowSponsor(true)
    window.addEventListener('guanxingtai-sponsor-prompt', show)
    return () => window.removeEventListener('guanxingtai-sponsor-prompt', show)
  }, [])

  return (
    <div className="min-h-screen flex flex-col">
      {/* Aurora 极光背景 */}
      <div className="aurora-bg" />
      {/* 星点背景 */}
      <div className="star-bg" />

      {/* 头部 - 毛玻璃导航 */}
      <header
        className="
          sticky top-0 z-40
          py-4 px-6 lg:px-12
          bg-night/80 backdrop-blur-xl
          border-b border-white/[0.06]
        "
      >
        <div className="max-w-[1600px] mx-auto flex items-center justify-between">
          {/* Logo + 导航 */}
          <div className="flex items-center gap-4 lg:gap-10">
            {/* 返回观星台主站。
                高级盘是独立构建的子应用，原来整个头部没有任何回主站的入口，
                用户点进来就出不去，只能靠浏览器后退键。
                用普通链接而不是 history.back()：从搜索引擎或分享链接直接进来的人，
                浏览器历史里根本没有观星台。 */}
            <a
              href="/"
              className="
                flex items-center gap-1.5 shrink-0
                px-3 py-2 min-h-[40px] rounded-lg
                text-sm text-text-secondary hover:text-gold
                border border-white/[0.08] hover:border-gold/30
                bg-white/[0.03] transition-colors
              "
              aria-label="返回观星台首页"
            >
              <span aria-hidden="true">←</span>
              <span>观星台</span>
            </a>

            {/* Logo */}
            <div className="flex items-center gap-3">
              {/* Logo 图标 */}
              <div
                className="
                  relative w-10 h-10 rounded-xl hidden sm:flex
                  bg-gradient-to-br from-star/20 to-gold/20
                  border border-white/[0.1]
                  flex items-center justify-center
                  shadow-[0_0_20px_rgba(124,58,237,0.2)]
                "
              >
                <span className="text-lg text-gold">☆</span>
                <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-star/10 to-transparent animate-pulse" />
              </div>
              {/* Logo 文字 */}
              <div>
                <h1
                  className="
                    text-lg sm:text-xl font-bold whitespace-nowrap
                    bg-gradient-to-r from-star-light via-gold to-star-light
                    bg-clip-text text-transparent
                    bg-[length:200%_auto] animate-[shimmer_4s_ease-in-out_infinite]
                  "
                  style={{ fontFamily: 'var(--font-serif)' }}
                >
                  紫微高级盘
                </h1>
                {/* 原来这里写的是上游项目品牌「紫微知道 · AI 命理工具」，
                    用户从观星台点进来会以为跳到了别的网站。
                    上游署名保留在 GPL 许可证、SOURCE.txt 与源码包里。 */}
                <p className="text-text-muted text-xs hidden sm:block">
                  观星台 · 大限流年与四化飞星
                </p>
              </div>
            </div>

            {/* 桌面端导航 */}
            <nav className="hidden md:flex items-center gap-1">
              {TABS.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`
                    group relative px-4 py-2 rounded-lg
                    text-sm font-medium transition-all duration-200
                    ${activeTab === tab.key
                      ? 'text-text'
                      : 'text-text-muted hover:text-text-secondary'
                    }
                  `}
                >
                  {/* 背景 */}
                  <span
                    className={`
                      absolute inset-0 rounded-lg transition-all duration-200
                      ${activeTab === tab.key
                        ? 'bg-white/[0.08]'
                        : 'group-hover:bg-white/[0.04]'
                      }
                    `}
                  />
                  {/* 内容 */}
                  <span className="relative flex items-center gap-2">
                    <span className={`
                      inline-flex h-4 w-4 items-center justify-center text-xs transition-all duration-200
                      ${activeTab === tab.key ? 'text-gold' : 'opacity-50 group-hover:opacity-70'}
                    `}>
                      {tab.icon}
                    </span>
                    {tab.label}
                  </span>
                  {/* 下划线指示器 */}
                  <span
                    className={`
                      absolute -bottom-1 left-1/2 -translate-x-1/2
                      h-0.5 rounded-full
                      bg-gradient-to-r from-star via-gold to-star
                      transition-all duration-300
                      ${activeTab === tab.key ? 'w-2/3 opacity-100' : 'w-0 opacity-0'}
                    `}
                  />
                </button>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={() => setShowSponsor(true)} className="hidden sm:inline-flex items-center gap-2 rounded-xl border border-gold/25 bg-gold/[0.06] px-3 py-2 text-xs text-gold hover:bg-gold/[0.12] transition-colors" title="自愿支持本站"><span>♡</span>支持本站</button>
            <GitHubLinkButton />

            {/* 设置按钮 */}
            <button
              onClick={() => setShowSettings(true)}
              className="
                group relative p-2.5 rounded-xl
                bg-white/[0.04] border border-white/[0.08]
                hover:bg-white/[0.08] hover:border-white/[0.12]
                transition-all duration-200
              "
              title="设置"
            >
              <svg
                className="w-5 h-5 text-text-muted group-hover:text-text transition-colors"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* 移动端底部导航 */}
      <nav
        className="
          md:hidden fixed bottom-0 left-0 right-0 z-40
          px-4 py-3
          bg-night/90 backdrop-blur-xl
          border-t border-white/[0.06]
        "
      >
        <div className="flex justify-around max-w-md mx-auto">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`
                flex flex-col items-center gap-1 px-4 py-1.5 rounded-lg
                transition-all duration-200
                ${activeTab === tab.key
                  ? 'text-gold'
                  : 'text-text-muted'
                }
              `}
            >
              <span className="inline-flex h-5 w-5 items-center justify-center text-base">{tab.icon}</span>
              <span className="text-xs">{tab.label}</span>
              {/* 选中指示点 */}
              {activeTab === tab.key && (
                <span className="absolute -top-1 w-1 h-1 rounded-full bg-gold shadow-[0_0_6px_rgba(212,175,55,0.6)]" />
              )}
            </button>
          ))}
        </div>
      </nav>

      {/* 主内容 */}
      <main className="flex-1 px-4 lg:px-12 py-8 pb-24 md:pb-8">
        <div className="max-w-[1600px] mx-auto">
          {/* 命盘解读标签 */}
          <div className={activeTab === 'chart' ? '' : 'hidden'}>
            {!chart ? (
              <div className="flex items-center justify-center min-h-[60vh]">
                <BirthForm />
              </div>
            ) : (
              <div className="animate-fade-in space-y-8">
                {/* 命盘 - 横向展开 */}
                <div className="w-full">
                  <ChartDisplay />
                </div>

                {/* AI 解读 - 下方展示，与命盘等宽 */}
                <div className="w-full max-w-6xl mx-auto">
                  <AIInterpretation />
                </div>

                {/* 重新输入按钮 */}
                <div className="text-center">
                  <button
                    onClick={() => useChartStore.getState().clear()}
                    className="
                      inline-flex items-center gap-2 px-4 py-2 rounded-lg
                      text-sm text-text-muted
                      hover:text-text hover:bg-white/[0.04]
                      transition-all duration-200
                    "
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    重新输入
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 年度运势标签 */}
          <div className={activeTab === 'fortune' ? '' : 'hidden'}>
            {!chart ? (
              <div className="flex items-center justify-center min-h-[60vh]">
                <EmptyState
                  message="请先在「命盘解读」中输入您的生辰信息"
                  action={() => setActiveTab('chart')}
                  actionLabel="前往输入"
                />
              </div>
            ) : (
              <YearlyFortune />
            )}
          </div>

          {/* 人生K线标签 */}
          <div className={activeTab === 'kline' ? '' : 'hidden'}>
            {!chart ? (
              <div className="flex items-center justify-center min-h-[60vh]">
                <EmptyState
                  message="请先在「命盘解读」中输入您的生辰信息"
                  action={() => setActiveTab('chart')}
                  actionLabel="前往输入"
                />
              </div>
            ) : (
              <LifeKLine />
            )}
          </div>

          {/* 双人合盘标签 */}
          <div className={activeTab === 'match' ? '' : 'hidden'}><MatchAnalysis /></div>

          {/* 分享卡片标签 */}
          <div className={activeTab === 'share' ? '' : 'hidden'}>
            {!chart ? (
              <div className="flex items-center justify-center min-h-[60vh]">
                <EmptyState
                  message="请先在「命盘解读」中输入您的生辰信息"
                  action={() => setActiveTab('chart')}
                  actionLabel="前往输入"
                />
              </div>
            ) : (
              <div className="max-w-xl mx-auto">
                <ShareCard />
              </div>
            )}
          </div>
        </div>
      </main>

      <button onClick={() => setShowSponsor(true)} className="fixed bottom-20 right-4 z-40 inline-flex items-center gap-1.5 rounded-full border border-gold/35 bg-night/90 px-3 py-2 text-xs text-gold shadow-xl backdrop-blur-md md:bottom-5" aria-label="打开自愿赞助"><span>♡</span>支持</button>

      {/* 设置弹窗 */}
      {showSettings && (
        <div
          className="
            fixed inset-0 z-50
            bg-black/60 backdrop-blur-sm
            flex items-center justify-center p-4
          "
          onClick={(e) => e.target === e.currentTarget && setShowSettings(false)}
        >
          <div className="animate-fade-in">
            <SettingsPanel onClose={() => setShowSettings(false)} />
          </div>
        </div>
      )}

      {showSponsor && (
        <div className="fixed inset-0 z-[70] bg-black/75 backdrop-blur-md flex items-center justify-center p-4" onClick={(event) => event.target === event.currentTarget && setShowSponsor(false)}>
          <section className="relative w-full max-w-lg max-h-[94vh] overflow-auto rounded-2xl border border-gold/40 bg-[#111027] p-6 sm:p-8 text-center shadow-2xl">
            <button className="absolute right-4 top-3 text-2xl text-text-muted hover:text-text" onClick={() => setShowSponsor(false)} aria-label="关闭赞助提示">×</button>
            <span className="text-xs tracking-[.24em] text-gold">自愿支持</span>
            <h2 className="mt-3 text-2xl font-semibold text-text">愿这次参详，给你一点清晰</h2>
            <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-text-muted">如果这张盘对你有帮助，可以请作者喝杯茶。支持会用于服务器、资料整理和免费解读调用。</p>
            <div className="mt-5 grid grid-cols-5 gap-2">{['9.9','19.9','39.9','66','99'].map(value => <button key={value} onClick={() => setSponsorAmount(value)} className={`rounded-lg border px-1 py-2 text-xs ${sponsorAmount === value ? 'border-gold bg-gold/15 text-gold-light' : 'border-white/10 text-text-muted'}`}>¥{value}</button>)}</div>
            <div className="mt-5 grid grid-cols-2 gap-4"><figure><div className="aspect-square overflow-hidden rounded-xl bg-white p-2"><img src="/sponsor/wechat.jpg" alt="微信自愿赞助二维码" className="h-full w-full object-cover" /></div><figcaption className="mt-2 text-xs text-text-muted">微信赞助</figcaption></figure><figure><div className="aspect-square overflow-hidden rounded-xl bg-white p-2"><img src="/sponsor/alipay.jpg" alt="支付宝自愿赞助二维码" className="h-full w-full object-cover" /></div><figcaption className="mt-2 text-xs text-text-muted">支付宝赞助</figcaption></figure></div>
            <p className="mt-3 text-xs text-gold/80">扫码后在付款页手动输入 ¥{sponsorAmount}</p>
            <button className="mt-5 text-sm text-text-muted underline underline-offset-4" onClick={() => setShowSponsor(false)}>暂时不用，继续免费使用</button>
            <small className="mt-2 block text-[11px] text-text-muted/70">完全自愿，不赞助也不会减少任何功能</small>
          </section>
        </div>
      )}

      {/* 底部 - 仅桌面端显示 */}
      <footer
        className="
          hidden md:block
          py-6 text-center text-text-muted text-sm
          border-t border-white/[0.04]
        "
      >
        <p className="flex items-center justify-center gap-2">
          <span className="text-gold/60">☆</span>
          <a href="/" className="hover:text-gold">观星台</a> · 基于开源项目「紫微知道」修改 · <OpenSourceFooterLinks />
          <span className="text-star/60">☆</span>
        </p>
      </footer>

      <LocaleController />
    </div>
  )
}

/* ------------------------------------------------------------
   空状态组件
   ------------------------------------------------------------ */

interface EmptyStateProps {
  message: string
  action: () => void
  actionLabel: string
}

function EmptyState({ message, action, actionLabel }: EmptyStateProps) {
  return (
    <div
      className="
        text-center p-8 rounded-2xl
        bg-white/[0.02] border border-white/[0.06]
      "
    >
      <div className="text-4xl mb-4 opacity-30">☆</div>
      <p className="text-text-muted mb-4">{message}</p>
      <button
        onClick={action}
        className="
          inline-flex items-center gap-2
          px-4 py-2 rounded-lg
          bg-star/20 text-star-light
          hover:bg-star/30 transition-colors
        "
      >
        {actionLabel}
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
        </svg>
      </button>
    </div>
  )
}
