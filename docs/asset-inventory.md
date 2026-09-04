# 前端资源盘点

盘点日期：2026-09-04

## 当前主渲染链

`_layouts/default.html` 当前直接使用：

- `assets/css/site.css`
- `assets/js/theme.js`
- `_includes/profile-card.html`

## 内容资源

以下资源仍被文章或页面内容引用，应保留：

- `assets/images/hashmap-resize.png`
- `images/posts/**`
- `_data/**`

## 已删除的旧主题资源

2026-07-23 根据全仓引用扫描删除：

- 旧版 header、footer、sidebar、分享和 2D 粒子 includes
- Primer、Octicons、Share.js、jQuery 和 jQuery UI
- 旧搜索、Prism、Mermaid、流程图和时序图资源
- 未使用的旧主题 CSS、截图、二维码和加载图

删除前 `assets/` 约为 4.7 MB，删除后约为 100 KB。历史资源仍可从 Git 记录恢复。

## 后续任务

### P0：验证新版页面

- 检查首页、文章、分类、归档、关于和 404 页面。
- 检查桌面端与移动端布局。
- 检查亮色、暗色和 `prefers-reduced-motion` 模式。
- 通过浏览器 Performance/Lighthouse 检查终端主题的可读性、对比度和首屏性能。
- 确认 GitHub Actions 的 Pages build 成功。

### P1：移除评论功能（代码已完成）

- [x] 从 `_layouts/page.html` 和 `_layouts/post.html` 删除评论区域。
- [x] 删除 `_includes/comments.html`。
- [x] 从 `_config.yml` 删除 Gitalk、Gitment、Disqus 及 `lazy_load_disqus` 配置。
- [ ] 轮换或注销当前暴露过的 GitHub OAuth 凭证（需要在 GitHub 账户中操作）。
- [x] 清理各页面 front matter 中不再生效的 `comments` 字段。
- [ ] 构建站点并确认文章、普通页面和 404 页面不再加载评论相关 CDN 资源。

### P2：删除确认废弃的前端资源（已完成）

- [x] 删除旧 includes、CSS、JavaScript 和 vendor 文件。
- [x] 确认当前模板和文章没有残留资源引用。
- [ ] 通过 GitHub Actions 执行 Pages build 和关键产物检查。
