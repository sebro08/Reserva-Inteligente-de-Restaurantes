@echo off
REM ============================================================================
REM Poblado de la base de datos transaccional (PostgreSQL) desde el CMD de Windows.
REM Equivalente a seed.ps1 (que SOLO funciona en PowerShell). Usa redireccion de
REM stdin (<), que CMD soporta de forma nativa con "docker exec -i".
REM Prerrequisito: la API ya debe haber creado el esquema ("Conectado a PostgreSQL").
REM ============================================================================
setlocal
set "PSQL=docker exec -i restaurante_db psql -U restaurante_admin -d restaurante_db"

echo Iniciando poblado de la base de datos...

echo 1. Insertando catalogos SQL base...
%PSQL% < backend\seed\01_country.sql
%PSQL% < backend\seed\02_role.sql
%PSQL% < backend\seed\03_status.sql

echo 2. Insertando datos geograficos desde CSV...
%PSQL% -c "\copy province(code, name, country_id) FROM STDIN DELIMITER ',' CSV HEADER;" < backend\seed\provinces.csv
%PSQL% -c "\copy canton(code, name, province_id) FROM STDIN DELIMITER ',' CSV HEADER;" < backend\seed\cantones.csv
%PSQL% -c "\copy district(code, canton_id, name) FROM STDIN DELIMITER ',' CSV HEADER;" < backend\seed\districts.csv

echo 3. Insertando datos transaccionales (usuarios, platos y ordenes)...
%PSQL% < backend\seed\05_transactional.sql

echo Poblado de base de datos finalizado exitosamente.
endlocal
