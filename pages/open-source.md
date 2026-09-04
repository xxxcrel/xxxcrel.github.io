---
layout: default
title: Open Source Projects
keywords: 开源,open-source,GitHub,开源项目
description: 开源改变世界。
permalink: /open-source/
---

<header class="content-header">
    <span class="section-badge">Projects</span>
    <h1 class="content-title">Open Source</h1>
    <p class="content-subtitle">公开项目与实验性代码。</p>
</header>

{% if site.github.public_repositories != null %}
{% assign sorted_repos = (site.github.public_repositories | sort: 'stargazers_count') | reverse %}

<section class="repo-list" aria-label="Open Source projects">
        <!-- Check here for github metadata -->
        <!-- https://help.github.com/articles/repository-metadata-on-github-pages/ -->
        {% for repo in sorted_repos %}
        <a href="{{ repo.html_url }}" target="_blank" rel="noreferrer" class="project-card">
            <h2>{{ repo.name }}</h2>
            <p>{{ repo.description | default: "暂无项目描述" }}</p>
            <span>{{ repo.stargazers_count }} stars · {{ repo.forks_count }} forks</span>
            <time datetime="{{ repo.updated_at }}">updated {{ repo.updated_at | date: '%Y-%m-%d' }}</time>
        </a>
        {% endfor %}
</section>
{% endif %}
