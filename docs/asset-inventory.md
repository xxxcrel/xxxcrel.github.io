# 前端资源盘点

盘点日期：2026-07-23

## 当前主渲染链

`_layouts/default.html` 当前直接使用：

- `assets/css/site.css`
- `assets/js/theme.js`
- Three.js `0.180.0`（固定版本 CDN）
- `assets/js/three-background.js`
- `_includes/profile-card.html`

## 内容资源

以下资源仍被文章或页面内容引用，应保留：

- `assets/images/hashmap-resize.png`
- `images/posts/**`
- `_data/**`

## 未进入当前主渲染链

下面的资源来自旧主题或已隐藏的功能，目前没有从新 `default` 布局加载：

- `_includes/header.html`
- `_includes/footer.html`
- `_includes/sidebar-*.html`
- `_includes/sns-share.html`
- `_includes/particle-script.html`（已由 Three.js 背景替代）
- `assets/css/components/**`
- `assets/css/globals/**`
- `assets/css/pages/**`
- `assets/css/posts/**`
- `assets/css/pygments/**`
- `assets/css/sections/**`
- `assets/js/jquery-ui.js`
- `assets/js/jquery.toc.js`
- `assets/js/main.js`
- `assets/js/search.js`
- `assets/js/simple-jekyll-search.min.js`
- `assets/js/geopattern.js`
- `assets/js/prism.js`
- `assets/js/mermaid.min.js`
- `assets/js/flow.js`
- `assets/js/raphael.min.js`
- `assets/js/snap.svg-min.js`
- `assets/js/underscore-min.js`
- `assets/js/webfont.js`
- `assets/vendor/**`
- `assets/search_data.json`

## 删除建议

1. 先在部署后的站点抽查文章、Wiki、分类、归档、评论和 404 页面。
2. 确认不再恢复旧版搜索、仓库卡片和流程图功能。
3. 将上述未使用资源作为一个独立提交删除，便于必要时回滚。
4. 删除后重新执行 Pages build 和内部链接检查。

本轮只记录候选项，不直接删除，避免将历史文章的隐式能力与布局拆分混在同一变更中。

## 后续任务

### P0：验证新版页面

- 检查首页、文章、分类、归档、关于和 404 页面。
- 检查桌面端与移动端布局。
- 检查亮色、暗色和 `prefers-reduced-motion` 模式。
- 通过浏览器 Performance/Lighthouse 检查 Three.js 背景的帧率、CPU 和首屏影响。
- 确认 GitHub Actions 的 Pages build 成功。

### P1：移除评论功能（代码已完成）

- [x] 从 `_layouts/page.html` 和 `_layouts/post.html` 删除评论区域。
- [x] 删除 `_includes/comments.html`。
- [x] 从 `_config.yml` 删除 Gitalk、Gitment、Disqus 及 `lazy_load_disqus` 配置。
- [ ] 轮换或注销当前暴露过的 GitHub OAuth 凭证（需要在 GitHub 账户中操作）。
- [x] 清理各页面 front matter 中不再生效的 `comments` 字段。
- [ ] 构建站点并确认文章、普通页面和 404 页面不再加载评论相关 CDN 资源。

### P2：删除确认废弃的前端资源

- 按功能分批删除旧 includes、CSS、JavaScript 和 vendor 文件。
- 每批删除后执行 Pages build 和关键页面检查。
