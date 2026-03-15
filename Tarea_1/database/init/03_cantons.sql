COPY canton(code,name,province_id)
FROM '/docker-entrypoint-initdb.d/cantones.csv'
DELIMITER ','
CSV HEADER;