#!/bin/bash

# Esperar a que todos los contenedores levanten
sleep 15

echo "Iniciando Config Servers..."
mongosh --host mongocfg1:27019 --eval "
rs.initiate({
  _id: 'mongors1conf',
  configsvr: true,
  members: [
    { _id: 0, host: 'mongocfg1:27019' },
    { _id: 1, host: 'mongocfg2:27019' },
    { _id: 2, host: 'mongocfg3:27019' }
  ]
})
"

sleep 10

echo "Iniciando Shard 1..."
mongosh --host mongors1n1:27018 --eval "
rs.initiate({
  _id: 'mongors1',
  members: [
    { _id: 0, host: 'mongors1n1:27018' },
    { _id: 1, host: 'mongors1n2:27018' },
    { _id: 2, host: 'mongors1n3:27018' }
  ]
})
"

echo "Iniciando Shard 2..."
mongosh --host mongors2n1:27018 --eval "
rs.initiate({
  _id: 'mongors2',
  members: [
    { _id: 0, host: 'mongors2n1:27018' },
    { _id: 1, host: 'mongors2n2:27018' },
    { _id: 2, host: 'mongors2n3:27018' }
  ]
})
"

echo "Iniciando Shard 3..."
mongosh --host mongors3n1:27018 --eval "
rs.initiate({
  _id: 'mongors3',
  members: [
    { _id: 0, host: 'mongors3n1:27018' },
    { _id: 1, host: 'mongors3n2:27018' },
    { _id: 2, host: 'mongors3n3:27018' }
  ]
})
"

sleep 15

echo "Configurando mongos1..."
mongosh --host mongos1:27017 --eval "
sh.addShard('mongors1/mongors1n1:27018,mongors1n2:27018,mongors1n3:27018')
sh.addShard('mongors2/mongors2n1:27018,mongors2n2:27018,mongors2n3:27018')
sh.addShard('mongors3/mongors3n1:27018,mongors3n2:27018,mongors3n3:27018')
sh.enableSharding('restaurant_db')
"

echo "Configurando mongos2..."
# Ya shardings e índices están en el config server, solo por seguridad validamos 1
mongosh --host mongos2:27017 --eval "
sh.status()
"

echo "Creando índices y shardeando colecciones en restaurant_db..."
mongosh --host mongos1:27017 --eval "
db.getSiblingDB('restaurant_db').plate.createIndex({ menu_id: 1 })
db.getSiblingDB('restaurant_db').reservation.createIndex({ restaurant_id: 1 })
sh.shardCollection('restaurant_db.plate', { menu_id: 1 })
sh.shardCollection('restaurant_db.reservation', { restaurant_id: 1 })
"

echo "Poblando base de datos..."
mongosh --host mongos1:27017 /seed.js

echo "Reiniciando API por consistencia..."
# Esto reiniciaría el contenedor desde el host en entornos manuales, 
# pero aquí como init no tiene acceso al docker daemon fácilmente, 
# el API igual intentará reconectarse.

echo "Setup finalizado!"
