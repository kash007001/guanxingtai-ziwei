/**
 * [INPUT]: Depends on birth date, selected shichen, and birthplace text
 * [OUTPUT]: Provides birthplace matching and true-solar-time birth resolution
 * [POS]: Domain helper between BirthForm input and iztro chart generation
 * [PROTOCOL]: Update this header when changed, then check AGENTS.md/CLAUDE.md
 */

import { EXTRA_BIRTHPLACES } from './extra-birthplaces'

export interface Birthplace {
  name: string
  province?: string
  city?: string
  area?: string
  longitude: number
  latitude?: number
  // IANA 时区。缺省为 Asia/Shanghai（birthplace-data.json 全是大陆地点）
  timeZone?: string
  // 地区，只用于显示，不参与匹配（否则「台湾台南」会因为包含「台湾」匹配到第一个台湾城市）
  region?: string
  // 简繁写法、英文名等别名
  aliases?: string[]
}

export interface ResolveBirthTimeInput {
  year: number
  month: number
  day: number
  hour: number
  birthplace?: string
  enabled: boolean
}

export interface ResolveBirthTimeWithDataInput extends ResolveBirthTimeInput {
  birthplaces?: Birthplace[]
}

export interface ResolvedBirthTime {
  year: number
  month: number
  day: number
  hour: number
  minute: number
  timeIndex: number
  originalShichen: string
  correctedShichen: string
  correctionMinutes: number
  applied: boolean
  crossedDate: boolean
  location: Birthplace | null
}

const DEFAULT_TIME_ZONE = 'Asia/Shanghai'
const MINUTES_PER_LONGITUDE_DEGREE = 4
const REPRESENTATIVE_MINUTE = 0

const SHICHEN_NAMES = [
  '子时',
  '丑时',
  '寅时',
  '卯时',
  '辰时',
  '巳时',
  '午时',
  '未时',
  '申时',
  '酉时',
  '戌时',
  '亥时',
] as const

export function findBirthplace(input?: string): Birthplace | null {
  return findBirthplaceInData(input, [])
}

export async function findBirthplaceAsync(input?: string): Promise<Birthplace | null> {
  const birthplaces = await loadBirthplaceData()
  return findBirthplaceInData(input, birthplaces)
}

export function findBirthplaceInData(input: string | undefined, birthplaces: Birthplace[]): Birthplace | null {
  const normalized = normalizePlace(input)
  if (!normalized) return null

  const ranked = birthplaces
    .map((place) => ({ place, score: scoreBirthplaceMatch(normalized, place) }))
    .filter((candidate) => candidate.score > 0)
    .sort((left, right) => right.score - left.score)

  return ranked[0]?.place ?? null
}

export async function resolveBirthTimeAsync(input: ResolveBirthTimeInput): Promise<ResolvedBirthTime> {
  const birthplaces = await loadBirthplaceData()
  return resolveBirthTime({ ...input, birthplaces })
}

export function resolveBirthTime(input: ResolveBirthTimeWithDataInput): ResolvedBirthTime {
  const originalTimeIndex = hourToTimeIndex(input.hour)
  const originalShichen = shichenNameForTimeIndex(originalTimeIndex)
  const location = findBirthplaceInData(input.birthplace, input.birthplaces ?? [])
  const shouldApply = input.enabled && location !== null

  // 出生地钟表时间，按 UTC 字段存放，只做纯分钟加减。
  // 不用本地 Date：那会套上「看盘的人」所在地的夏令时，和出生地无关。
  const wallClock = Date.UTC(input.year, input.month - 1, input.day, input.hour, REPRESENTATIVE_MINUTE)
  const correctionMinutes = shouldApply
    ? getTrueSolarCorrectionMinutes(wallClock, location)
    : 0
  const correctedDate = new Date(wallClock + correctionMinutes * 60_000)
  const timeIndex = shouldApply
    ? dateToTimeIndex(correctedDate)
    : originalTimeIndex
  const correctedShichen = shichenNameForTimeIndex(timeIndex)

  return {
    year: correctedDate.getUTCFullYear(),
    month: correctedDate.getUTCMonth() + 1,
    day: correctedDate.getUTCDate(),
    hour: correctedDate.getUTCHours(),
    minute: correctedDate.getUTCMinutes(),
    timeIndex,
    originalShichen,
    correctedShichen,
    correctionMinutes: Math.round(correctionMinutes),
    applied: shouldApply,
    crossedDate: isDifferentDate(input, correctedDate),
    location,
  }
}

async function loadBirthplaceData(): Promise<Birthplace[]> {
  const mod = await import('./birthplace-data.json')
  return [...(mod.default as Birthplace[]), ...EXTRA_BIRTHPLACES]
}

export function shichenNameForTimeIndex(timeIndex: number): string {
  if (timeIndex === 12) return SHICHEN_NAMES[0]
  return SHICHEN_NAMES[timeIndex] ?? ''
}

function normalizePlace(input?: string): string {
  return (input ?? '').trim().replace(/\s+/g, '').toLowerCase()
}

function scoreBirthplaceMatch(input: string, place: Birthplace): number {
  const fullTokens = [
    joinPlace(place.province, place.city, place.area),
    joinPlace(place.province, place.city),
    joinPlace(place.city, place.area),
  ].filter((token): token is string => !!token).map(normalizePlace)
  const localTokens = [place.name, place.area, place.city, ...(place.aliases ?? [])]
    .filter((token): token is string => !!token)
    .map(normalizePlace)
  const tokens = getPlaceTokens(place)

  if (tokens.some((token) => token === input)) return 100
  if (fullTokens.some((token) => equalsWithoutAdministrativeSuffix(input, token))) return 95
  if (localTokens.some((token) => equalsWithoutAdministrativeSuffix(input, token))) return 90
  if (fullTokens.some((token) => isSpecificToken(token) && input.includes(token))) return 85
  if (localTokens.some((token) => isSpecificToken(token) && input.includes(token))) return 80
  if (localTokens.some((token) => {
    const stripped = stripAdministrativeSuffix(token)
    return isSpecificToken(stripped) && input.includes(stripped)
  })) return 60
  return 0
}

function getPlaceTokens(place: Birthplace): string[] {
  const rawTokens = [
    place.name,
    place.province,
    place.city,
    place.area,
    joinPlace(place.province, place.city),
    joinPlace(place.city, place.area),
    joinPlace(place.province, place.city, place.area),
    ...(place.aliases ?? []),
  ]

  return Array.from(new Set(rawTokens.filter((token): token is string => !!token).map(normalizePlace)))
}

function joinPlace(...parts: Array<string | undefined>): string | undefined {
  const value = parts.filter(Boolean).join('')
  return value || undefined
}

function stripAdministrativeSuffix(value: string): string {
  return value.replace(/(特别行政区|自治州|地区|盟|市|县|区|省)$/u, '')
}

function equalsWithoutAdministrativeSuffix(left: string, right: string): boolean {
  const normalizedLeft = stripAdministrativeSuffix(left)
  const normalizedRight = stripAdministrativeSuffix(right)

  return isSpecificToken(normalizedLeft) && normalizedLeft === normalizedRight
}

function isSpecificToken(value: string): boolean {
  return value.length >= 2
}

// 真太阳时 = 钟表时间 − 当时当地的 UTC 偏移 + 经度 × 4 分钟 + 时差方程。
// 偏移取出生地在出生那一刻的历史值，夏令时自然包含在内：
// 大陆 1986–1991、香港 1979 年前、台湾 1979 年前都实行过夏令时，海外城市更是年年切换。
// 大陆标准时间下偏移是 480 分钟，结果与原来的 (经度 − 120) × 4 完全一致。
function getTrueSolarCorrectionMinutes(wallClock: number, location: Birthplace): number {
  const offset = zoneOffsetAtWallClock(location.timeZone ?? DEFAULT_TIME_ZONE, wallClock)
  return location.longitude * MINUTES_PER_LONGITUDE_DEGREE - offset + getEquationOfTimeMinutes(wallClock)
}

const offsetFormatters = new Map<string, Intl.DateTimeFormat>()

function offsetAtInstant(timeZone: string, instant: number): number {
  let formatter = offsetFormatters.get(timeZone)
  if (!formatter) {
    formatter = new Intl.DateTimeFormat('en-US', {
      timeZone,
      hourCycle: 'h23',
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
    })
    offsetFormatters.set(timeZone, formatter)
  }
  const parts = Object.fromEntries(formatter.formatToParts(new Date(instant)).map((part) => [part.type, part.value]))
  const asUtc = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour) % 24,
    Number(parts.minute),
    Number(parts.second),
  )
  return Math.round((asUtc - instant) / 60_000)
}

// 钟表时间对应的偏移：先按钟表时间猜一次，再用猜出的真实时刻校正一次，夏令时切换当天也对。
function zoneOffsetAtWallClock(timeZone: string, wallClock: number): number {
  const guess = offsetAtInstant(timeZone, wallClock)
  return offsetAtInstant(timeZone, wallClock - guess * 60_000)
}

function getEquationOfTimeMinutes(wallClock: number): number {
  const date = new Date(wallClock)
  const start = Date.UTC(date.getUTCFullYear(), 0, 0)
  const dayOfYear = Math.floor((wallClock - start) / 86_400_000)
  const b = (2 * Math.PI * (dayOfYear - 81)) / 364

  return 9.87 * Math.sin(2 * b) - 7.53 * Math.cos(b) - 1.5 * Math.sin(b)
}

function hourToTimeIndex(hour: number): number {
  if (hour === 23) return 12
  if (hour >= 0 && hour < 1) return 0
  return Math.floor((hour + 1) / 2)
}

function dateToTimeIndex(date: Date): number {
  const hour = date.getUTCHours()
  if (hour === 23) return 12
  if (hour === 0) return 0
  return Math.floor((hour + 1) / 2)
}

function isDifferentDate(input: ResolveBirthTimeInput, date: Date): boolean {
  return (
    input.year !== date.getUTCFullYear()
    || input.month !== date.getUTCMonth() + 1
    || input.day !== date.getUTCDate()
  )
}
