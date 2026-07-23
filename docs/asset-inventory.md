# 前端资源盘点

盘点日期：2026-07-23

## 当前主渲染链

`_layouts/default.html` 当前直接使用：

- `assets/css/site.css`
- `assets/js/theme.js`
- Three.js `0.180.0`（固定版本 CDN）
- `assets/js/three-background.js`
- `_includes/profile-card.html`
- `_includes/comments.html`（由 page/post 布局按需使用）

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
