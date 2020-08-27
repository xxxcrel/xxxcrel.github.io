---
layout: post
title: proxy config
categories: linux proxy
description: 
keywords: proxy, Linux
---

## linux系统下的各种代理配置踩坑

- wget, curl, git(https方式)等命令行使用.bashrc, .zshrc中的代理环境变量

  ```shell
  export http_proxy="http://127.0.0.1:12333"
  export https_proxy="http://127.0.0.1:12333"
  export no_proxy="localhost, 127.0.0.1, 192.168.1.*"
  ```

- snap代理通过命令行配置
  
  ```shell
  sudo snap set system proxy.http="http://127.0.0.1:12333"
  sudo snap set system proxy.https="http://127.0.0.1:12333"
  ```

- apt, apt-get 代理配置
  
  ```shell
  sudo vim /etc/apt/apt.conf
  Acquire::http::proxy "http://127.0.0.1:12333";
  Acquire::ftp::proxy "ftp://127.0.0.1:12333";
  Acquire::https::proxy "https://127.0.0.1:12333";
  ```

- 其他类似浏览器走全局代理或使用插件走代理