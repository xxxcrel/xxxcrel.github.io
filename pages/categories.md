---
layout: categories
title: Categories
description: 哈哈，你找到了我的文章基因库
keywords: 分类
menu: 分类
permalink: /categories/
---

{% assign category_count = site.categories | size %}
<div class="index-summary"><span>{{ category_count }} categories</span><span>{{ site.posts | size }} entries</span></div>
<section class="category-index">
{% assign sorted_categories = site.categories | sort %}
{% for category in sorted_categories %}
{% assign category_name = category | first %}
{% assign category_id = category_name | slugify %}
{% assign category_label = category_name %}
{% case category_name %}
{% when "powerjob" %}{% assign category_label = "PowerJob" %}
{% when "java generic" %}{% assign category_label = "Java Generic" %}
{% when "linux proxy" %}{% assign category_label = "Linux Proxy" %}
{% endcase %}
<section class="category-group" id="{{ category_id }}">
<h2>{{ category_label }} <small>/ {{ category.last | size }}</small></h2>
<ol class="category-posts">
{% for post in category.last %}
<li>
<time datetime="{{ post.date | date_to_xmlschema }}">{{ post.date | date:"%Y-%m-%d" }}</time>
<a href="{{ post.url | relative_url }}">{{ post.title }}</a>
</li>
{% endfor %}
</ol>
</section>
{% endfor %}
</section>
<!-- /section.content -->
