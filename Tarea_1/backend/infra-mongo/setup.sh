#!/bin/bash
echo "Inicializando Servidor de Configuración (rs-config)..."
docker exec -it m-configsvr mongosh --port 27019 --eval "
rs.initiate({
  _id: 'rs-config',
  configsvr: true,
  members: [
    { _id: 0, host: 'configsvr:27019' }
  ]
})
"

sleep 5

echo "Inicializando Shard 1 (rs-shard1 con 1 primario y 2 secundarios)..."
docker exec -it m-shard1a mongosh --port 27018 --eval "
rs.initiate({
  _id: 'rs-shard1',
  members: [
    { _id: 0, host: 'shard1a:27018' },
    { _id: 1, host: 'shard1b:27028' },
    { _id: 2, host: 'shard1c:27038' }
  ]
})
"

sleep 15

echo "Añadiendo Shard 1 al Router (mongos)..."
docker exec -it m-mongos mongosh --port 27017 --eval "
sh.addShard('rs-shard1/shard1a:27018,shard1b:27028,shard1c:27038')
"

echo "Habilitando Sharding en la base de datos 'restaurant_db'..."
docker exec -it m-mongos mongosh --port 27017 --eval "
sh.enableSharding('restaurant_db')
"

echo "Creando índices y particionando colecciones..."
docker exec -it m-mongos mongosh --port 27017 --eval "
use restaurant_db;
db.plate.createIndex({ menu_id: 1 });
db.reservation.createIndex({ restaurant_id: 1 });
sh.shardCollection('restaurant_db.plate', { menu_id: 1 });
sh.shardCollection('restaurant_db.reservation', { restaurant_id: 1 });
"

echo "Clúster MongoDB inicializado con éxito. (El backend debe apuntar a localhost:27017)"