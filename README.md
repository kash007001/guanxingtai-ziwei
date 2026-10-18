# 观星台 · 紫微高级盘

免费的紫微斗数排盘，在线使用：<https://mingli.musedesk.net/ziwei-advanced/>

本仓库是线上版本对应的完整源码，基于开源项目
[ziweiknows/ziwei-chart](https://github.com/ziweiknows/ziwei-chart)（上游提交
`b172413d85addbe32facd9e20b9179db619f3afb`）修改，按 GPL-3.0-or-later 发布。
排盘计算使用 [iztro](https://github.com/SylarLong/iztro)。

观星台主站另有八字、六爻、奇门遁甲和西洋占星：<https://mingli.musedesk.net/>

## 相对上游的主要修改

- **字体**：移除对 Google Fonts 的依赖（中国大陆无法访问），改用系统中文字体。
- **统计**：移除 Vercel Analytics。
- **搜索引擎可见性**：构建产物注入静态说明内容（`seo-inject.html`），
  对用户可见，不按 User-Agent 区别对待。
- **站点整合**：返回观星台主站的入口、品牌与年份输入宽度调整。
- **时区与夏令时**：真太阳时不再假定东经 120 度（北京时间），改为按出生地的
  IANA 时区取出生当时的历史 UTC 偏移（`src/lib/true-solar-time.ts`）。
  大陆 1986–1991 年、香港和台湾 1979 年前的夏令时，以及海外城市每年的夏令时都会自动扣除；
  换算全程用 UTC 字段，结果与看盘者所在地无关。
- **出生地**：补充台湾 22 县市、港澳和海外华人常见城市，简繁写法与英文名均可匹配
  （`src/lib/extra-birthplaces.ts`）。

## 已知限制

- 海外只收录华人常见城市；未收录的地点会按原时辰排盘（页面会提示未匹配）。

## 本地运行

```bash
npm install
npm run dev
```

## 许可证

GPL-3.0-or-later，全文见 [LICENSE](LICENSE)。上游项目的版权归原作者所有。

---

Ziwei Dou Shu (Purple Star Astrology) chart, modified from
[ziweiknows/ziwei-chart](https://github.com/ziweiknows/ziwei-chart) under GPL-3.0-or-later.
Live at <https://mingli.musedesk.net/ziwei-advanced/>.
