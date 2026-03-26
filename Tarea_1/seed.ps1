Write-Host "Iniciando poblado de la base de datos..."

Write-Host "1. Insertando catálogos SQL base..."
Get-Content backend\seed\01_country.sql | docker exec -i restaurante_db psql -U restaurante_admin -d restaurante_db
Get-Content backend\seed\02_role.sql | docker exec -i restaurante_db psql -U restaurante_admin -d restaurante_db
Get-Content backend\seed\03_status.sql | docker exec -i restaurante_db psql -U restaurante_admin -d restaurante_db

Write-Host "2. Insertando datos geográficos desde CSV (Puede tomar unos segundos)..."
Get-Content backend\seed\provinces.csv -Encoding UTF8 | docker exec -i restaurante_db psql -U restaurante_admin -d restaurante_db -c "\copy province(code, name, country_id) FROM STDIN DELIMITER ',' CSV HEADER;"
Get-Content backend\seed\cantones.csv -Encoding UTF8 | docker exec -i restaurante_db psql -U restaurante_admin -d restaurante_db -c "\copy canton(code, name, province_id) FROM STDIN DELIMITER ',' CSV HEADER;"
Get-Content backend\seed\districts.csv -Encoding UTF8 | docker exec -i restaurante_db psql -U restaurante_admin -d restaurante_db -c "\copy district(code, canton_id, name) FROM STDIN DELIMITER ',' CSV HEADER;"

Write-Host "¡Poblado de base de datos finalizado exitosamente!"
