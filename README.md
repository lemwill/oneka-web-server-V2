# Oneka Web server

## Dev Env

The developpment is running on docker with docker compose. To launch the server you should install :

* [Docker](https://docs.docker.com/docker-for-windows/install/)
* [docker-compose](https://docs.docker.com/compose/install/)

### To start the app

```shell
cd project/folder/base
docker build -t oneka/webserver -f Docker/Dockerfile .
env GRAFANA_RESSOURCES=project/folder/base/Docker/grafana/ docker-compose -f Docker/docker-compose.yaml up
```

## Production env

### To show logs

```shell
pm2 logs
```

### To see app staus

```shell
pm2 status
```

it should show something like

```shell
root@ns3273031:/home/oneka-web-server-V2# pm2 status
┌─────────────────┬────┬─────────┬──────┬──────┬────────┬─────────┬────────┬──────┬───────────┬──────┬──────────┐
│ App name        │ id │ version │ mode │ pid  │ status │ restart │ uptime │ cpu  │ mem       │ user │ watching │
├─────────────────┼────┼─────────┼──────┼──────┼────────┼─────────┼────────┼──────┼───────────┼──────┼──────────┤
│ ONEKA-SERVER-V2 │ 0  │ 1.0.0   │ fork │ 9144 │ online │ 2       │ 8m     │ 2.9% │ 45.1 MB   │ root │ disabled │
└─────────────────┴────┴─────────┴──────┴──────┴────────┴─────────┴────────┴──────┴───────────┴──────┴──────────┘
Use `pm2 show <id|name>` to get more details about an app
```

### To stop the app

```shell
pm2 stop {id}
```

the id is shown in the pm2 status command
