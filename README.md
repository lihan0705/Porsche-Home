# 保时捷之家 · Porsche Home

一个可以布置、探索、保存和拜访的三维车主园区。面向黑客松的独立全栈原型，界面以中文为主。

## 功能

- 真实三维车库欢迎页与站内登录弹窗：可拖动的 Carrera 4S、车身打光、车灯、阴影与地面倒影。资源准备完成后点击进入，初次镜头从园区大门低机位缓缓靠近，大门随之打开。
- 丰富的园区陈设：红白路肩的私人弯道、花境、倒影池与木桥、工坊品牌墙和工具车、会客灯串与路牌。

- 默认从 Three.js 园区总览进入：道路连接四处可点击的地点，选择地点后进入对应体验，也可返回总览继续探索。
- **归处庭院**：车主住宅与车库，可选择现代庭院、玻璃展亭、山间木屋；搭配松林、橄榄树、柏树，以及日间、黄昏、夜色与晴雨。
- **独立工坊**：靠近车辆，探索可拖动、播放和复原的外观分组拆解。动力总成采用示意模型，未使用厂商工程 CAD。
- **故事展廊**：阅读主人的爱车故事；主人可编辑故事和空间名称。
- **会客花园**：查看访客留下的明信片，并通过拜访链接邀请朋友参观。
- Porsche 911 Carrera 4S 外观模型，六种车色及两种轮毂颜色。
- 自然语言布置：配置模型密钥后使用 OpenAI Responses API + JSON Schema。未配置时明确显示“基础指令模式”，只解析支持的关键词，不伪装成大模型。
- 登录后将住宅、车辆配置及个人故事保存到 Cloudflare D1；车主权限由服务端校验。
- 每座家有独立的 `/?visit=<id>` 拜访链接，访客只读参观并寄送持久化明信片。

## 演示路线

**总览 → 归处布置 → 工坊拖拆解 → 展廊故事 → 会客明信片**。

先在总览看到四处建筑与相连的道路，进入归处调整房屋、植物、光线和车色，再到工坊拖动拆解滑杆并复原车辆。随后进入展廊阅读或编辑个人故事，保存住宅并打开独立拜访链接，以访客视角在会客花园寄送明信片。互访是通过链接进行的异步参观；当前版本不包含实时多人漫游或照片上传。

## 本地开发

需要 Node.js >=22.13、npm 和 Git。

车型资源会在首次启动或构建时由 `scripts/prepare-assets.mjs` 从 PlayCanvas 原始教学来源下载并校验 SHA-256；Draco 解码器从锁定的 Three.js 依赖复制。生成的二进制资源不重复提交进 Git，模型署名与许可证保留在源码中。

```sh
npm ci
npm run build
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_small_gabe_jones.sql
npm run dev
```

开发地址由终端输出，默认 `http://127.0.0.1:5173/`。本地登录由保留的 Sites 开发集成模拟；访问 `/signin-with-chatgpt?return_to=/` 即可使用测试身份。模拟登录不包含在生产构建中。

## AI 配置

生产环境通过托管平台的 secret manager 设置 `OPENAI_API_KEY`，可选设置 `OPENAI_MODEL`（默认 `gpt-5-mini`）。本地可创建被 Git 忽略的 `.dev.vars`，参考 `.env.example`。密钥只在服务端使用。

没有密钥时页面仍可手动布置、按关键词布置、保存和拜访。自由语义理解需要真正连接模型。AI 结果由服务端校验，不能执行任意脚本。

## 部署与迁移

当前项目保留 Sites 的 Vinext/Cloudflare Worker 构建集成，托管声明在 `.openai/hosting.json`，结构化存储绑定为 `DB`。生产发布会应用 `drizzle/` 中的数据库迁移。

源码可以放在自己的 GitHub 私有仓库；GitHub 保存源码，Cloudflare Worker/Sites 承载应用，D1 保存数据。GitHub Pages 单独托管静态文件不能承载这里的服务器接口。

新站默认仅站点主人可访问。拜访链接不会绕过站点的访问策略；向朋友展示时，需要由站点主人配置访问成员或选择适合演示的访问范围。

其他部署环境需要提供同等的身份信任边界：`oai-authenticated-user-id` 必须由可信网关注入并清理客户端伪造值。不要将接受任意身份头的 Worker 直接作为公开站点部署。若迁移至其他平台，应替换认证适配并保留服务端所有权校验。

## 验证

```sh
npx tsc --noEmit
node --experimental-strip-types --test tests/design.test.ts
npm run build
```

集成测试使用本地构建 Worker 的 5174 端口，只写入本地 D1 测试数据：

```sh
npm start -- --port 5174
node --test tests/api.test.mjs
```

覆盖匿名保存拒绝、跨车主修改拒绝、跨域修改拒绝、配置校验、明信片持久化、更新保留住宅 ID 与失效链接。

## 模型署名与范围

Porsche 911 Carrera 4S 模型作者：**Karol Miklas / Lionsharp Studios**，许可 **CC BY-SA 4.0**。来源为作者 Sketchfab 页面与 PlayCanvas 官方教学资产。模型及其适配保留该许可，详情和原始链接见 `public/models/attribution.txt`。Draco 解码器许可见其旁的许可证文件。

本站为独立概念原型，未声明 Porsche 官方发布或背书。外观分组动画用于交互展示，不能作为维修、装配或车型工程资料。

欢迎页与登录弹窗采用银灰色实时 3D 展厅，带灯光、阴影、地面反射与可拖动的观察视角。911 的外观组件从悬浮展开状态分阶段归位，可重播；加载完成后可以直接进入，无需等待动画。系统偏好减少动态效果时直接显示完整车辆。入园默认从大门外的低机位开始，滑动门缓缓开启；底部“地图”可切换到全园俯瞰。
