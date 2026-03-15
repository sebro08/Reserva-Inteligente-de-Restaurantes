COPY district(code,canton_id,name)
FROM '/docker-entrypoint-initdb.d/districts.csv'
DELIMITER ','
CSV HEADER;