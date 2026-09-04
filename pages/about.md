---
layout: page
title: About
description: Be a geek
keywords: Xuecheng, 克里尔
menu: 关于
permalink: /about/
---

<section class="profile-intro">
<p class="terminal-command"><span>~</span> cat about.md</p>
<h2>Be a geek.</h2>
<p>克里尔的个人技术空间，记录工程实践、阅读笔记，以及持续学习的过程。</p>
</section>

## 联系

{% for website in site.data.social %}
* {{ website.sitename }}：[@{{ website.name }}]({{ website.url }})
{% endfor %}

## Stack

{% for category in site.data.skills %}
### {{ category.name }}
<div class="skill-list">
{% for keyword in category.keywords %}
<span>{{ keyword }}</span>
{% endfor %}
</div>
{% endfor %}
