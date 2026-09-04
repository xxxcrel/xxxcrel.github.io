---
layout: page
title: Links
description: 没有链接的博客是孤独的
keywords: 友情链接
menu: 链接
permalink: /links/
---

> 没有链接的博客是孤独的。

{% for link in site.data.links %}
  {% if link.src == 'life' %}
* [{{ link.name }}]({{ link.url }})
  {% endif %}
{% endfor %}

{% for link in site.data.links %}
  {% if link.src == 'www' %}
* [{{ link.name }}]({{ link.url }})
  {% endif %}
{% endfor %}
