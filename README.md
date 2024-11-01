# listenTemp

## Description

Ce projet node vise à récupérer la température sur un serveur Ubuntu Server, et de la ressortir sur un serveur Web node.

## Préréquis

- Node.js
- npm
- Ubuntu Server
- Le package lm-sensors
- Pour le HDD, le package smartmontools

## Utilisation 

Ce projet vise à être utilisé en collaboration avec Prometheus et Grafana. 

Le code à rajouter dans la configuration Prometheus : 

```bash
- job_name: 'temp'
  static_configs:
    - targets: ['localhost:9101']
```

Un exemple de dashboard réalisé avec Grafana peut être trouvé dans le fichier "dashboard_grafana.json".

## Différentes versions

- index.js : Récupère la température du CPU dans le cas d'un seul CPU
- indexV2.js : Récupère la température du CPU dans le cas de plusieurs CPU
- indexV3.js : Récupère la température du CPU dans le cas d'un seul CPU, mais aussi la température du HDD
