# 部署手册：让全网都能扫码打开《求是》H5（MATIC-InfoSecurity 版）

> 适用对象：没有服务器、没买域名、第一次部署网页的同学。
> 全程免费，约 10 分钟。做完之后你会得到一个公开网址，任何人都能打开。

## 本作品的正式地址（已写入代码，无需再改）

```
https://MATIC-InfoSecurity.github.io/zju-qiushi-h5/
```

工程里所有地方都已经填好这个地址：页面分享框的默认值、`index.html` 顶部的
`window.QIUSHI_SITE_URL`、静态兜底二维码 `assets/img/qrcode.png`。

> ⚠️ 唯一的例外：GitHub Pages 的网址用的是**仓库名**，所以仓库名必须叫 `zju-qiushi-h5`。
> 如果你建成了 `<用户名>.github.io` 这种"根域名仓库"，网址会变成
> `https://matic-infosecurity.github.io/`，而且 `index.html` 必须放在仓库根目录。
> 换过名字的话，做完第 3 节后按第 5 节把地址替换一次即可（3 条命令）。

---

## 0. 先搞清楚三件事

| 概念 | 一句话解释 | 在你这儿是什么 |
|---|---|---|
| GitHub 仓库 | 存放你网页文件的"网盘文件夹" | 名为 `zju-qiushi-h5` |
| GitHub Pages | GitHub 免费送的静态网站托管 | 开启后把你的仓库变成一个网址 |
| 入口文件 | 访问网址时默认打开的那一个文件 | 必须叫 `index.html`（已在工程根目录，不用改） |

**关键规则**：GitHub Pages 只托管**静态文件**（HTML/CSS/JS/图片）。你这个作品恰好是纯静态的 —— 所以只要把文件传上去就能跑，不需要买服务器。

**另一个关键规则**：`index.html` 必须在你要发布的目录的**根**上。本工程就是这样，所以不要把它挪进子文件夹。

---

## 1. 准备：注册 GitHub 账号

1. 打开 <https://github.com/signup>，用邮箱注册（记好用户名，它决定你的网址前缀）。
2. 验证邮箱，登录。

> 用户名已经确定是 **MATIC-InfoSecurity**，所以最终网址就是
> `https://MATIC-InfoSecurity.github.io/zju-qiushi-h5/`（前提是仓库命名为 `zju-qiushi-h5`）。

---

## 2. 路线 A：网页上传（零命令行，推荐第一次做的时候用）

1. 登录后点右上角 `+` → **New repository**。
2. 填写：
   - **Repository name**：`zju-qiushi-h5`（必须全小写、用连字符，别用中文和空格）
   - **Description**：浙江大学求是精神交互长卷（可选）
   - 选择 **Public**（必须公开，否则 Pages 免费版无法发布）
   - **不要**勾选 "Add a README file"（避免后面冲突）
3. 点 **Create repository**。
4. 在新仓库页面点 **uploading an existing file**（或 Add file → Upload files）。
5. 把本工程**根目录里的全部内容**拖进去：
   ```
   index.html
   assets/            ← 整个文件夹一起拖（包含 css / js / img）
   ```
   > 也可以把 `README.md`、`设计说明.md`、`部署手册.md` 一起传上去，方便老师查看。
   > `tools/`、`build/` 是开发辅助，传不传都行（不传也不影响网页运行）。
6. 下方 Commit message 随便写（如 `first upload`），点 **Commit changes**。
7. 确认仓库根目录能直接看到 `index.html`（不是 `zju-qiushi-h5/index.html` 这种多套一层）。

**注意**：如果你拖进去的是一个文件夹（上传后变成 `zju-qiushi-h5/index.html`），网页会是 404。解决办法：重新上传，或者把文件夹里的文件"拖出来"。

---

## 3. 开启 GitHub Pages

1. 进入仓库 → **Settings**（顶部齿轮/标签栏）。
2. 左侧栏找到 **Pages**。
3. **Build and deployment** → **Source** 选 `Deploy from a branch`。
4. **Branch** 选 `main`，右侧目录选 `/ (root)`，点 **Save**。
5. 等 1–3 分钟，刷新该页面，顶部会出现绿色提示：
   > Your site is live at `https://matic-infosecurity.github.io/zju-qiushi-h5/`

打开这个网址，应该能看到封面"求是 · 一所大学的回答"。

---

## 4. 路线 B：命令行部署（会 git 的同学用这个，后续更新最省事）

> 只在**你自己电脑上**执行。注意：DeepSeek Harness 内的命令沙箱默认不能联网，`git push` 这类联网操作请在自己电脑的终端里跑。

```bash
# 1) 进入工程目录（按你的实际路径改）
cd "D:/DeepSeek-Harness/Work Area/zju-qiushi-h5"

# 2) 初始化仓库（只做一次）
git init
git branch -M main

# 3) 首次提交
git add .
git commit -m "浙江大学求是精神 H5：首次发布"

# 4) 关联到你在 GitHub 建的仓库
git remote add origin https://github.com/MATIC-InfoSecurity/zju-qiushi-h5.git

# 5) 推送
git push -u origin main
```

然后按第 3 节开启 Pages（一次即可）。以后每次改完内容：

```bash
git add .
git commit -m "更新文案"
git push
```

Pages 会在 1 分钟内自动重新构建。

**推送时要求密码怎么办**：GitHub 不接受账号密码，需要在
Settings → Developer settings → Personal access tokens 生成一个 token，
推送时用户名填 GitHub 用户名，密码粘贴这个 token。

---

## 5. 二维码：已经做好了，正常情况不用管

**先说结论**：页面里的分享二维码是**运行时按地址栏的真实网址现场生成**的。
你的网址是 `https://MATIC-InfoSecurity.github.io/zju-qiushi-h5/`，部署成功后打开页面，
第 9 屏（尾声）那张码**自动就是这个地址**，不用做任何操作。

工程里另外还存了一张**静态兜底二维码**（`assets/img/qrcode.svg` / `.png`，用于禁用 JS 或断网预览），
它**也已经指向你的真实地址**了，并且经过解码校验（见第 7 节）。

**只有在这些情况下才需要重新生成**：① 你把仓库名改成了别的；② 你绑定了自定义域名；③ 你换了学校服务器地址。

```bash
# 换成新地址（结尾斜杠建议保留）
python tools/qrgen.py "https://新地址/" assets/img/qrcode.svg assets/img/qrcode.png

# 验一下这张码能不能被正确解出来（会打印解出的文本）
python tools/qrcheck.py assets/img/qrcode.png "https://新地址/"

# 重新打包单文件版（如果作业交的是单文件）
node tools/build-single.js
```

`qrcode.png` 可以单独拿去贴进 PPT 尾页、海报、作业封底（296×296 纯黑白，放大不糊）。

**页面上还有一个更方便的办法**：第 9 屏的网址输入框可以直接粘贴任何地址，点
"用这个网址生成二维码"就立刻重画，点"下载二维码图片"能存成 PNG —— 现场答辩要临时改地址，
用这个最快，不用碰代码。

---

## 6. 生成"扫码用"的二维码图片（答辩/海报用）

- **方法一（本工程自带）**：跑上面的 `tools/qrgen.py`，得到 `assets/img/qrcode.png`（296×296，纯黑白，可放大）。
- **方法二（网页工具）**：浏览器打开 <https://cli.im/> 或 <https://www.qr-code-generator.com/>，粘贴你的网址，直接下载。
- **方法三（微信）**：手机浏览器打开你的网址 → 微信"扫一扫"旁的"识图"，或直接用系统截图工具截下页面里的二维码区域。

> 打印建议：二维码四周留白（quiet zone）不要裁掉，这是扫码成功的关键。

---

## 7. 上线后自检清单（5 条，逐条打勾）

| # | 检查项 | 期望结果 |
|---|---|---|
| 1 | 打开 `https://MATIC-InfoSecurity.github.io/zju-qiushi-h5/` | 出现封面，标题"求是 · 一所大学的回答" |
| 2 | 手机 4G（不用 Wi-Fi）扫二维码 | 能打开，且排版正常（不是电脑版缩放） |
| 3 | 点击右侧圆点导航 | 能跳到对应屏；顶部进度条会变化 |
| 4 | 滑到第 4 屏，点"竺校长自己怎么回答？" | 展开两段回答；输入框能打字并保存 |
| 5 | 滑到第 9 屏（尾声） | 二维码显示出来，且指向你的网址 |

---

## 8. 常见问题排查

| 现象 | 原因 | 解决办法 |
|---|---|---|
| 打开是 404 | `index.html` 不在仓库根目录；或 Pages 还没构建完 | 调整文件层级；等 1–3 分钟再刷新，看 Settings → Pages 的绿色提示 |
| 页面没样式、光秃秃的 | `assets/` 没上传完整（CSS/JS 404） | 检查仓库里有没有 `assets/css/style.css`；用浏览器 F12 → Network 看哪个文件 404 |
| 中文乱码 | 文件被存成了 GBK | 本工程文件都是 UTF-8，重新用 UTF-8 上传；确认 `index.html` 头部有 `<meta charset="utf-8">` |
| 二维码指向 example.github.io | 说明 JS 没加载成功（运行时二维码会覆盖兜底图） | 按 F12 → Console 看报错；确认 `assets/js/qr.js` 已上传 |
| 声音按钮点了没反应 | 浏览器要求用户手势后才能播放；或设备静音 | 先点一次"开始行走"，再点右上角"声音"；检查系统音量 |
| 手机上太宽/太小 | 用了老版本浏览器 | 用微信内置浏览器或 Chrome / Safari 打开；本页已做移动端适配 |
| 电脑上看着像手机 | 这是有意设计 | 宽度 ≥900px 时页面会套一个手机取景框，方便预览；想看全屏效果就把窗口拖窄到 900px 以下 |
| 想换网址前缀 | 仓库名改了 | 仓库 Settings → 改名，Pages 地址随之变化；记得重跑第 5 节换二维码 |
| 想用学校服务器 | 学院给了空间 | 把 `index.html` + `assets/` 整个上传到网站根目录即可，无需任何构建 |

---

## 9. 进阶（可选，加分项）

1. **绑定自定义域名**：Settings → Pages → Custom domain 填你的域名，然后在域名服务商处加 CNAME 记录。GitHub 会自动配 HTTPS。
2. **加访问统计**：在 `index.html` 底部加一段不蒜子（busuanzi）或百度统计代码，能看到有多少人访问过你的作品。
3. **加真实校歌音频**：把校歌 mp3 放到 `assets/audio/`，在 `index.html` 第 9 屏加一个 `<audio controls src="assets/audio/song.mp3">`。
   > 注意版权：校内作业引用一般没问题，但公开传播请注明来源，或只放官方链接。
4. **加"分享到微信"引导**：在尾声屏加一句"右上角 → 发送给朋友"，这是移动端分享成功率最高的方式。
5. **做成 PWA**：加一个 `manifest.json` 和 Service Worker，手机可以"添加到主屏幕"，离线也能看。

---

## 10. 一页速查（贴在手边）

```
仓库名      : zju-qiushi-h5（不是这个名字就要按第 5 节改地址）
入口文件    : index.html（必须在根目录）
Pages 设置  : Settings → Pages → Source: Deploy from a branch → main → / (root)
访问网址    : https://MATIC-InfoSecurity.github.io/zju-qiushi-h5/
换二维码    : python tools/qrgen.py "<你的网址>" assets/img/qrcode.svg assets/img/qrcode.png
本地预览    : node tools/serve.js 8765   →  http://127.0.0.1:8765/
单文件版    : node tools/build-single.js   →  build/浙江大学求是精神H5-单文件版.html
```
