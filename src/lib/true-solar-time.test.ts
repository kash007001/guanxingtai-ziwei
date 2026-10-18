import { describe, expect, it } from 'vitest'
import birthplaceData from './birthplace-data.json'
import {
  type Birthplace,
  findBirthplaceInData,
  resolveBirthTimeAsync,
  shichenNameForTimeIndex,
} from './true-solar-time'

const SICHUAN_CHENGDU = '\u56db\u5ddd\u6210\u90fd'
const CHENGDU = '\u6210\u90fd'
const CHENGDU_CITY = '\u6210\u90fd\u5e02'
const SHAANXI_YANAN = '\u9655\u897f\u5ef6\u5b89'
const YANAN_CITY = '\u5ef6\u5b89\u5e02'
const BEIJING = '\u5317\u4eac'
const BEIJING_CITY = '\u5317\u4eac\u5e02'
const URUMQI = '\u4e4c\u9c81\u6728\u9f50'
const MARS_BASE = '\u706b\u661f\u57fa\u5730'
const WU_SHICHEN = '\u5348\u65f6'
const SI_SHICHEN = '\u5df3\u65f6'
const ZI_SHICHEN = '\u5b50\u65f6'
const BIRTHPLACE_DATA = birthplaceData as Birthplace[]

describe('findBirthplace', () => {
  it('matches common city names from plain birthplace input', () => {
    expect(findBirthplaceInData(SICHUAN_CHENGDU, BIRTHPLACE_DATA)?.name).toBe(CHENGDU_CITY)
    expect(findBirthplaceInData(SICHUAN_CHENGDU, BIRTHPLACE_DATA)?.longitude).toBeCloseTo(104.08, 2)
  })

  it('matches non-popular prefecture-level cities from the local data set', async () => {
    const yanAn = await resolveBirthTimeAsync({
      year: 1990,
      month: 1,
      day: 1,
      hour: 12,
      birthplace: SHAANXI_YANAN,
      enabled: true,
    })

    expect(yanAn.location?.name).toBe(YANAN_CITY)
    expect(yanAn.location?.longitude).toBeCloseTo(109.5, 1)
  })

  it('returns null when the birthplace cannot be matched', () => {
    expect(findBirthplaceInData(MARS_BASE, BIRTHPLACE_DATA)).toBeNull()
  })
})

describe('resolveBirthTime', () => {
  it('keeps the original time when true solar correction is disabled', async () => {
    const result = await resolveBirthTimeAsync({
      year: 1990,
      month: 1,
      day: 1,
      hour: 12,
      birthplace: CHENGDU,
      enabled: false,
    })

    expect(result.applied).toBe(false)
    expect(result.timeIndex).toBe(6)
    expect(result.correctedShichen).toBe(WU_SHICHEN)
  })

  it('uses birthplace longitude to move Chengdu noon birth into the previous shichen', async () => {
    const result = await resolveBirthTimeAsync({
      year: 1990,
      month: 1,
      day: 1,
      hour: 12,
      birthplace: CHENGDU,
      enabled: true,
    })

    expect(result.applied).toBe(true)
    expect(result.location?.name).toBe(CHENGDU_CITY)
    expect(result.correctionMinutes).toBeLessThan(-60)
    expect(result.originalShichen).toBe(WU_SHICHEN)
    expect(result.correctedShichen).toBe(SI_SHICHEN)
    expect(result.timeIndex).toBe(5)
  })

  it('keeps Beijing noon birth in noon shichen after correction', async () => {
    const result = await resolveBirthTimeAsync({
      year: 1990,
      month: 1,
      day: 1,
      hour: 12,
      birthplace: BEIJING,
      enabled: true,
    })

    expect(result.applied).toBe(true)
    expect(result.location?.name).toBe(BEIJING_CITY)
    expect(result.correctedShichen).toBe(WU_SHICHEN)
    expect(result.timeIndex).toBe(6)
  })

  it('moves the chart date when correction crosses midnight', async () => {
    const result = await resolveBirthTimeAsync({
      year: 1990,
      month: 1,
      day: 1,
      hour: 2,
      birthplace: URUMQI,
      enabled: true,
    })

    expect(result.applied).toBe(true)
    expect(result.year).toBe(1989)
    expect(result.month).toBe(12)
    expect(result.day).toBe(31)
    expect(result.correctedShichen).toBe(ZI_SHICHEN)
    expect(result.timeIndex).toBe(12)
  })
})

describe('time zones and daylight saving time', () => {
  const at = (birthplace: string, year: number, month: number, day: number, hour: number) =>
    resolveBirthTimeAsync({ year, month, day, hour, birthplace, enabled: true })

  it('removes the 1988 mainland DST hour (Beijing summer)', async () => {
    const summer = await at('北京', 1988, 7, 1, 12)
    const winter = await at('北京', 1988, 1, 1, 12)
    // 夏令时下钟表快一小时，真太阳时要多扣 60 分钟（另有约 7 分钟时差方程差异）
    expect(summer.correctionMinutes - winter.correctionMinutes).toBeLessThan(-50)
    expect(summer.correctedShichen).toBe('巳时')
  })

  it('matches Taiwan, Hong Kong and overseas cities in either script or English', async () => {
    expect((await at('台北', 1990, 1, 1, 12)).location?.timeZone).toBe('Asia/Taipei')
    expect((await at('臺灣臺南', 1990, 1, 1, 12)).location?.name).toBe('臺南市')
    expect((await at('香港九龙', 1990, 1, 1, 12)).location?.timeZone).toBe('Asia/Hong_Kong')
    expect((await at('Kuala Lumpur', 1990, 1, 1, 12)).location?.name).toBe('吉隆坡')
    expect((await at('悉尼', 1990, 1, 1, 12)).location?.name).toBe('雪梨')
  })

  it('uses the local offset abroad: New York summer 13:00 is about 12:00 solar time', async () => {
    const result = await at('纽约', 1995, 7, 1, 13)
    // 西五区夏令时 UTC−4；经度 −74 → 太阳时比钟表慢约 56 分钟，再加时差方程约 −4 分钟
    expect(result.correctionMinutes).toBeGreaterThan(-65)
    expect(result.correctionMinutes).toBeLessThan(-55)
    expect(result.correctedShichen).toBe('午时')
  })

  it('handles Hong Kong 1970 summer time', async () => {
    const result = await at('香港', 1970, 7, 1, 12)
    // UTC+9（夏令时），经度 114.17 → 约 −83 分钟，再加时差方程约 −4 分钟
    expect(result.correctionMinutes).toBeLessThan(-80)
    expect(result.correctedShichen).toBe('巳时')
  })
})

describe('shichenNameForTimeIndex', () => {
  it('names late zi time index as zi shichen', () => {
    expect(shichenNameForTimeIndex(12)).toBe(ZI_SHICHEN)
  })
})
