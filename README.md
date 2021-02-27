# Oneka Web server

## Dev Env

The developpment is running on docker with docker compose. To launch the server you should install :

* [Docker](https://docs.docker.com/docker-for-windows/install/)
* [docker-compose](https://docs.docker.com/compose/install/)

### To start the app

```shell
cd project/folder/base
env ONEKA_DEV_FOLDER=$(pwd) docker compose -f Docker/docker-compose.yaml up --remove-orphans
```
