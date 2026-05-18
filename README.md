# OpenToolBox

离线优先的本地效率工具箱。

## 使用

直接用浏览器打开 `index.html`。不需要构建、不需要安装依赖。

## 开发

```bash
npm.cmd run check
npm.cmd run start
```

`npm.cmd run start` 会启动本地静态服务器：

```txt
http://127.0.0.1:4188/
```

默认端口使用 `4188`，用于避开旧工具箱在 `4173` 上遗留的浏览器 `localStorage`。

`npm.cmd run check` 会同时执行工具注册检查和隐私检查，防止 `data/`、旧同步默认值或常见密钥格式进入公开仓库。

## 新增工具

编辑 `src/data/tools.js`。首页会自动从这个工具注册表渲染卡片。

## 目录结构

```txt
src/data/tools.js         工具注册表
src/js/index-page.js      首页交互逻辑
src/js/storage.js         localStorage 工具函数
src/css/open-toolbox.css  首页补丁样式
scripts/                  自动化脚本
docs/                     重构文档
```

## 开源数据规则

- `data/` 是本地个人导出数据目录，已加入 `.gitignore`。
- 不要提交密码、书签、笔记、LLM Key、OCR 记录、私密文本。
- 同步面板的 Token 只保存在当前浏览器的 `localStorage`，不会写入仓库，除非你手动把导出的数据文件提交。
- 首页的“清理本地数据”只清理当前地址和端口下的浏览器数据，不会影响 GitHub 仓库。
- 示例数据后续统一放到 `examples/`，必须脱敏。

## 当前状态

这个 V1 副本保留旧工具入口，同时完成了开源化第一步：清爽首页、工程元数据、CI、贡献指南、重构路线和本地检查脚本。
