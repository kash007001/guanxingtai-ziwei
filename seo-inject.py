#!/usr/bin/env python3
"""把静态 SEO 内容注入紫微高级盘的构建产物 index.html。

由 deploy-ziwei.sh 在「组装发布目录」之前调用，作用在 dist/index.html 上。
幂等：已注入过就跳过，不会叠加。

用法：  python3 seo-inject.py <dist/index.html>

为什么不改 vite 的 index.html 模板：那样每次都得重新构建，而这台机器构建必然 OOM
（rollup 把 1786 个模块全驻留内存，加到 3GB swap 也会被 OOM 杀掉）。
在产物上注入，可以复用已有的 dist，不需要任何构建。
"""

import pathlib
import sys

HERE = pathlib.Path(__file__).resolve().parent
MARK = "zwseo-injected"

target = pathlib.Path(sys.argv[1])
html = target.read_text(encoding="utf8")

if MARK in html:
    print("    SEO 内容已注入，跳过")
    sys.exit(0)

head_bits = (HERE / "seo-head.html").read_text(encoding="utf8")
body_bits = (HERE / "seo-inject.html").read_text(encoding="utf8")

if "</head>" not in html:
    raise SystemExit("!! dist/index.html 里找不到 </head>")
if '<div id="root"></div>' not in html:
    raise SystemExit('!! dist/index.html 里找不到 <div id="root"></div>')

html = html.replace("</head>", f"<!-- {MARK} -->\n{head_bits}</head>", 1)
# 放在 #root 之后：React 只接管 #root，这段不参与水合。
html = html.replace('<div id="root"></div>', f'<div id="root"></div>\n{body_bits}', 1)

target.write_text(html, encoding="utf8")
print(f"    SEO 内容已注入（{len(html.encode())} 字节）")
