COPY province(name, country_id)
FROM '/docker-entrypoint-initdb.d/provinces.csv'
DELIMITER ','
CSV HEADER;

COPY canton(name, province_id)
FROM '/docker-entrypoint-initdb.d/cantones.csv'
DELIMITER ','
CSV HEADER;

COPY district(name, canton_id)
FROM '/docker-entrypoint-initdb.d/districts.csv'
DELIMITER ','
CSV HEADER;