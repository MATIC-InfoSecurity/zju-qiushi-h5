# 求是：一所大学的回答

> 浙江大学"求是精神"交互长卷 · 大学生思想素养传播实践作业
> 单页 H5 · HTML + CSS + 原生 JavaScript · **零外部依赖**

从 1897 年的求是书院，到战火中两千六百公里的文军长征；从竺可桢校长的两问，到此刻屏幕前的你。
这是一条走了 129 年的路 —— 滑动十屏，走完它。

---

## 快速开始

### 方式一：双击打开（最快）
直接双击 `build/浙江大学求是精神H5-单文件版.html`。单文件版把 CSS/JS 全部内联，不需要服务器、不需要联网。

### 方式二：本地服务器预览（效果最接近线上）
```bash
node tools/serve.js 8765
# 然后浏览器打开 http://127.0.0.1:8765/
```
手机同局域网预览：把地址换成 `http://<你电脑的局域网IP>:8765/`。

### 方式三：部署到公网（作业提交用这个）
见 **[部署手册-GitHub-Pages.md](部署手册-GitHub-Pages.md)** —— 网页上传和命令行两条路线，含二维码更换与自检清单。

> 本作品的正式地址（代码里已配置好，部署后即为作品入口）：
> **https://MATIC-InfoSecurity.github.io/zju-qiushi-h5/**

---

## 作品包含什么

| 屏 | 内容 |
|---|---|
| 0 封面 | 动态"求是"徽标 + 校训标语打字机 |
| 1 源流 | 1897 → 2026 十四个时间节点，可点击展开 |
| 2 求是之解 | 竺可桢的定义、校歌的提醒、四个精神词 |
| 3 文军长征 | 西迁路线交互地图（7 站点 + 里程表 + 行走光点） |
| 4 竺老两问 | 打字机逐字显示两问，可展开竺校长的回答 |
| 5 我的回答 | 写下你的答案，保存在本机浏览器 |
| 6 六条准则 | 六张 3D 翻转卡：含义 + 历史底色 + 一句自问 |
| 7 求是人 | 林启、竺可桢、王淦昌、苏步青、李政道、程开甲、谷超豪…… |
| 8 求是小测 | 三道单选，即时判对错并给出解析 |
| 9 一起求是 + 尾声 | 生成个人"求是卡"、校歌《大不自多》、分享二维码 |

**背景**：10 屏各自一张浙江大学校区风景照（之江 / 紫金港 / 西溪 / 海宁国际校区），
带滚动视差与缓慢推拉；照片来自 Wikimedia Commons，CC BY / CC BY-SA / 公有领域授权，署名见页脚与
`assets/img/campus/CREDITS.md`。

**背景音乐**：浙江大学校歌《大不自多》（词 马一浮 / 曲 应尚能），三级音源自动降级：
官方录音直链 → 本地音频文件 → 自创钢琴版（原创旋律）。也可上传本地音频文件，
文件只在浏览器内播放、不上传。版权说明见下方"说明"一节。

**交互一览**：滚动入场、进度条、圆点导航、时间轴填充、点击展开、手风琴引语、SVG 路线行走、
数字滚动、打字机、3D 翻转卡、本地存储、答题判分、实时生成卡片、运行时生成二维码、
校歌播放器（音量/换源/上传）、双轨音频（校歌 + 氛围音自动压低）、
背景视差与 Ken Burns、键盘无障碍操作、打印样式。

---

## 目录结构

```
index.html                    入口（GitHub Pages 默认首页）
assets/css/style.css          样式（设计变量 / 组件 / 移动优先 / 桌面取景框 / 打印）
assets/js/data.js             内容数据层（改文案只动这里）
assets/js/app.js              交互逻辑
assets/js/audio.js            Web Audio 氛围音（不用任何音频文件）
assets/js/qr.js               运行时二维码生成
assets/img/qrcode.svg|png     静态兜底二维码
tools/                        开发与自检脚本（不影响网页运行）
build/                        单文件打包产物
设计说明与答辩要点.md           线框表 / 元素设计 / 技术方案 / 史实出处 / 答辩预设问答
部署手册-GitHub-Pages.md       从零到扫码可访问的完整步骤
```

---

## 自检脚本（都可在本地复现）

```bash
node tools/htmlcheck.js index.html     # 标签闭合、id 唯一、本地资源齐备
node tools/smoke.js index.html         # 无浏览器 DOM 冒烟：初始化 + 渲染 + 交互
node tools/build-single.js             # 生成单文件版

# 二维码：生成 + 独立解码校验（会打印解出的文本，确认扫得出来）
python tools/qrgen.py "https://MATIC-InfoSecurity.github.io/zju-qiushi-h5/" assets/img/qrcode.svg assets/img/qrcode.png
python tools/qrcheck.py assets/img/qrcode.png "https://MATIC-InfoSecurity.github.io/zju-qiushi-h5/"

# 二维码 JS 版与 Python 版逐位比对
python tools/qrgen_matrix.py "https://你的网址/" tools/_py_matrix.txt
node tools/qrjs_test.js tools/_py_matrix.txt "https://你的网址/"
```

---

## 说明

- 本作品为**课程作业**，非浙江大学官方页面；页面内校标为"求是"字样的自绘演绎，未使用官方校标原图。
- 全部史实均来自公开资料，逐条出处见《设计说明与答辩要点.md》第五节。
- 用户在页面上填写的回答与署名**只保存在本机浏览器**（`localStorage`），不会上传。
- **背景照片**：来自 Wikimedia Commons，遵循 CC BY 4.0 / CC BY-SA 3.0/4.0 / 公有领域授权，
  作者与许可证见 `assets/img/campus/CREDITS.md`（页面页脚也已署名）。按许可证要求使用，未做二次声明。
- **背景音乐**：校歌词作者马一浮、曲作者应尚能，**录音制品的权利属于浙江大学与表演者**。
  本页音频取自浙江大学官网"校歌"页面公开发布的录音，用于课程作业非商业演示，并同时提供
  [官网收听](https://www.zju.edu.cn/574/) 入口。若要长期公开传播，建议先取得授权，
  或改为"只放官网链接 + 自创钢琴版"的最稳做法（页面里点"自创钢琴版"即可切换）。
  `assets/audio/*.mp3` 已被 `.gitignore` 忽略，默认不会随仓库发布。
- 氛围音（风声与钟磬）由 Web Audio API 实时合成，不含任何音频文件，无第三方版权问题。

## 素材获取脚本

```bash
# 校区照片（Wikimedia Commons，含署名清单生成）
python tools/fetch_campus_photos.py --list     # 只看清单
python tools/fetch_campus_photos.py            # 下载 + 压缩到 assets/img/campus/

# 校歌音频（下载前请先读脚本顶部的版权说明）
python tools/probe_song.py                     # 查明官方出处与可取得性
python tools/fetch_song_audio.py --mp3-only    # 下载官方 mp3 到 assets/audio/（本地演示用）
```
