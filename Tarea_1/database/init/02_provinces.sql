COPY province(code,name,country_id)
FROM '/docker-entrypoint-initdb.d/provinces.csv'
DELIMITER ','
CSV HEADER;