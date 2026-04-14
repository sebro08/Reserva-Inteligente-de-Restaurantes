$ErrorActionPreference = "Stop"

Write-Host "Inicializando Servidor de Configuración (rs-config)..." -ForegroundColor Cyan
docker exec m-configsvr mongosh --port 27019 --eval "rs.initiate({_id: 'rs-config', configsvr: true, members: [{ _id: 0, host: 'configsvr:27019' }]})"
Start-Sleep -Seconds 5

Write-Host "`nInicializando Shard 1 (rs-shard1)..." -ForegroundColor Cyan
docker exec m-shard1a mongosh --port 27018 --eval "rs.initiate({_id: 'rs-shard1', members: [{ _id: 0, host: 'shard1a:27018' }, { _id: 1, host: 'shard1b:27028' }, { _id: 2, host: 'shard1c:27038' }]})"
Start-Sleep -Seconds 15

Write-Host "`nAñadiendo Shard 1 al Router (mongos)..." -ForegroundColor Cyan
docker exec m-mongos mongosh --port 27017 --eval "sh.addShard('rs-shard1/shard1a:27018,shard1b:27028,shard1c:27038')"

Write-Host "`nHabilitando Sharding en la base de datos 'restaurant_db'..." -ForegroundColor Cyan
docker exec m-mongos mongosh --port 27017 --eval "sh.enableSharding('restaurant_db')"

Write-Host "`nCreando índices y particionando colecciones..." -ForegroundColor Cyan
docker exec m-mongos mongosh --port 27017 --eval "db.getSiblingDB('restaurant_db').plate.createIndex({ menu_id: 1 }); db.getSiblingDB('restaurant_db').reservation.createIndex({ restaurant_id: 1 }); sh.shardCollection('restaurant_db.plate', { menu_id: 1 }); sh.shardCollection('restaurant_db.reservation', { restaurant_id: 1 });"

Write-Host "`nClúster MongoDB inicializado con éxito. (El backend debe apuntar a localhost:27017)" -ForegroundColor Green
