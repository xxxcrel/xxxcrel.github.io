---
layout: post
title: Spring initialization mechanism 
categories: Spring
description: Spring 初始化机制
keywords: Java, Spring, Initialization, Aware 
---

## 一些命令的备忘录

- 快速启动kafka监控redpanda-console

```shell
HOST_IP=HOST_IP=$(ifconfig eth0 | grep inet | grep -v inet6 | awk '{print $2}')
KAFKA_CONSOLE_CONF="kafka:
  brokers:
    - $HOST_IP:9092
  sasl:
    enabled: true
    username: alice
    password: hzmc456
    mechanism: PLAIN
server:
  listenPort: 28080"
sudo docker run -d -e CONFIG_FILEPATH=/tmp/console.yaml -e KAFKA_CONSOLE_CONF="$KAFKA_CONSOLE_CONF" --name console --network=host --entrypoint=/bin/sh docker.redpanda.com/vectorized/console -c 'echo "$KAFKA_CONSOLE_CONF" > /tmp/console.yaml; /app/console'
```