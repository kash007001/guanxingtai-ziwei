/**
 * [INPUT]: None
 * [OUTPUT]: Birthplaces outside mainland China (Taiwan, Hong Kong, Macau, overseas Chinese cities) with IANA time zones
 * [POS]: Supplements birthplace-data.json, which only covers mainland China
 * [PROTOCOL]: Update this header when changed, then check AGENTS.md/CLAUDE.md
 */

import type { Birthplace } from './true-solar-time'

// [名称, 经度, 纬度, IANA 时区, 地区, 别名（空格分隔，含简繁写法与英文，英文多词去掉空格）]
// 与主站增强层的城市表保持一致。
const ROWS: Array<[string, number, number, string, string, string]> = [
  ['臺北市', 121.5654, 25.033, 'Asia/Taipei', '臺灣', '臺北 台北 台北市 taipei'],
  ['新北市', 121.4657, 25.012, 'Asia/Taipei', '臺灣', '新北 板橋 板桥'],
  ['基隆市', 121.7419, 25.1276, 'Asia/Taipei', '臺灣', '基隆'],
  ['桃園市', 121.301, 24.9937, 'Asia/Taipei', '臺灣', '桃园 桃園 桃园市'],
  ['新竹市', 120.9686, 24.8039, 'Asia/Taipei', '臺灣', '新竹'],
  ['新竹縣', 121.0044, 24.8387, 'Asia/Taipei', '臺灣', '新竹县 竹北'],
  ['苗栗縣', 120.8214, 24.5602, 'Asia/Taipei', '臺灣', '苗栗 苗栗县'],
  ['臺中市', 120.6736, 24.1477, 'Asia/Taipei', '臺灣', '台中 臺中 台中市 taichung'],
  ['彰化縣', 120.5418, 24.0809, 'Asia/Taipei', '臺灣', '彰化 彰化县'],
  ['南投縣', 120.6874, 23.9157, 'Asia/Taipei', '臺灣', '南投 南投县'],
  ['雲林縣', 120.5436, 23.7092, 'Asia/Taipei', '臺灣', '云林 雲林 云林县 斗六'],
  ['嘉義市', 120.4491, 23.4801, 'Asia/Taipei', '臺灣', '嘉义 嘉義 嘉义市'],
  ['嘉義縣', 120.3325, 23.4591, 'Asia/Taipei', '臺灣', '嘉义县 太保'],
  ['臺南市', 120.227, 22.9999, 'Asia/Taipei', '臺灣', '台南 臺南 台南市 tainan'],
  ['高雄市', 120.3014, 22.6273, 'Asia/Taipei', '臺灣', '高雄 kaohsiung'],
  ['屏東縣', 120.4879, 22.6727, 'Asia/Taipei', '臺灣', '屏东 屏東 屏东县'],
  ['宜蘭縣', 121.753, 24.757, 'Asia/Taipei', '臺灣', '宜兰 宜蘭 宜兰县'],
  ['花蓮縣', 121.6014, 23.9872, 'Asia/Taipei', '臺灣', '花莲 花蓮 花莲县'],
  ['臺東縣', 121.144, 22.7583, 'Asia/Taipei', '臺灣', '台东 台東 臺東 台东县'],
  ['澎湖縣', 119.5664, 23.5655, 'Asia/Taipei', '臺灣', '澎湖 澎湖县 马公 馬公'],
  ['金門縣', 118.3171, 24.4321, 'Asia/Taipei', '臺灣', '金门 金門 金门县'],
  // 福建省也有一个连江县，名字要能一眼分开
  ['連江縣（馬祖）', 119.9396, 26.1524, 'Asia/Taipei', '臺灣', '马祖 馬祖 南竿'],
  ['香港特別行政區', 114.1694, 22.3193, 'Asia/Hong_Kong', '香港', '香港 香港特别行政区 九龙 九龍 新界 香港岛 香港島 沙田 荃湾 荃灣 元朗 屯门 屯門 将军澳 將軍澳 hongkong'],
  ['澳門', 113.5439, 22.1987, 'Asia/Macau', '澳門', '澳门 澳门特别行政区 澳門特別行政區 氹仔 路环 路環 macau macao'],
  ['新加坡', 103.8198, 1.3521, 'Asia/Singapore', '新加坡', 'singapore'],
  ['吉隆坡', 101.6869, 3.139, 'Asia/Kuala_Lumpur', '馬來西亞', 'kualalumpur'],
  ['檳城', 100.3327, 5.4141, 'Asia/Kuala_Lumpur', '馬來西亞', '槟城 喬治市 乔治市 penang'],
  ['新山', 103.7414, 1.4927, 'Asia/Kuala_Lumpur', '馬來西亞', 'johorbahru'],
  ['曼谷', 100.5018, 13.7563, 'Asia/Bangkok', '泰國', 'bangkok'],
  ['金邊', 104.9282, 11.5564, 'Asia/Phnom_Penh', '柬埔寨', '金边 phnompenh'],
  ['雅加達', 106.8456, -6.2088, 'Asia/Jakarta', '印尼', '雅加达 jakarta'],
  ['馬尼拉', 120.9842, 14.5995, 'Asia/Manila', '菲律賓', '马尼拉 manila'],
  ['胡志明市', 106.6297, 10.8231, 'Asia/Ho_Chi_Minh', '越南', '西贡 西貢 hochiminh saigon'],
  ['東京', 139.6917, 35.6895, 'Asia/Tokyo', '日本', '东京 tokyo'],
  ['大阪', 135.5023, 34.6937, 'Asia/Tokyo', '日本', 'osaka'],
  ['首爾', 126.978, 37.5665, 'Asia/Seoul', '韓國', '首尔 汉城 漢城 seoul'],
  ['倫敦', -0.1276, 51.5072, 'Europe/London', '英國', '伦敦 london'],
  ['巴黎', 2.3522, 48.8566, 'Europe/Paris', '法國', 'paris'],
  ['柏林', 13.405, 52.52, 'Europe/Berlin', '德國', 'berlin'],
  ['阿姆斯特丹', 4.9041, 52.3676, 'Europe/Amsterdam', '荷蘭', 'amsterdam'],
  ['杜拜', 55.2708, 25.2048, 'Asia/Dubai', '阿聯酋', '迪拜 dubai'],
  ['紐約', -74.006, 40.7128, 'America/New_York', '美國', '纽约 newyork nyc'],
  ['波士頓', -71.0589, 42.3601, 'America/New_York', '美國', '波士顿 boston'],
  ['芝加哥', -87.6298, 41.8781, 'America/Chicago', '美國', 'chicago'],
  ['休士頓', -95.3698, 29.7604, 'America/Chicago', '美國', '休斯顿 休斯敦 houston'],
  ['洛杉磯', -118.2437, 34.0522, 'America/Los_Angeles', '美國', '洛杉矶 losangeles'],
  ['舊金山', -122.4194, 37.7749, 'America/Los_Angeles', '美國', '旧金山 三藩市 sanfrancisco'],
  ['西雅圖', -122.3321, 47.6062, 'America/Los_Angeles', '美國', '西雅图 seattle'],
  ['溫哥華', -123.1207, 49.2827, 'America/Vancouver', '加拿大', '温哥华 vancouver'],
  ['多倫多', -79.3832, 43.6532, 'America/Toronto', '加拿大', '多伦多 toronto'],
  ['蒙特婁', -73.5673, 45.5017, 'America/Toronto', '加拿大', '蒙特利尔 满地可 滿地可 montreal'],
  ['卡加利', -114.0719, 51.0447, 'America/Edmonton', '加拿大', '卡尔加里 calgary'],
  ['雪梨', 151.2093, -33.8688, 'Australia/Sydney', '澳洲', '悉尼 sydney'],
  ['墨爾本', 144.9631, -37.8136, 'Australia/Melbourne', '澳洲', '墨尔本 melbourne'],
  ['布里斯本', 153.0251, -27.4698, 'Australia/Brisbane', '澳洲', '布里斯班 brisbane'],
  ['伯斯', 115.8605, -31.9505, 'Australia/Perth', '澳洲', '珀斯 perth'],
  // 加州也有个 Oakland，中文同样叫奥克兰，名字要能一眼分开
  ['奧克蘭（紐西蘭）', 174.7633, -36.8485, 'Pacific/Auckland', '紐西蘭', '奥克兰 奧克蘭 新西兰奥克兰 auckland'],
]

export const EXTRA_BIRTHPLACES: Birthplace[] = ROWS.map(([name, longitude, latitude, timeZone, region, aliases]) => ({
  name,
  region,
  longitude,
  latitude,
  timeZone,
  aliases: aliases.split(' '),
}))
