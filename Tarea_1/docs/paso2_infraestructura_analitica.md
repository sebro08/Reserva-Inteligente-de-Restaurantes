# Documentación y Estudio: Paso 2 - Infraestructura Analítica (Docker)

## 1. Resumen de lo Implementado
En este paso extendimos la arquitectura del proyecto basada en microservicios, integrando herramientas orientadas al procesamiento y análisis de grandes volúmenes de datos (Big Data). El objetivo fue complementar las bases de datos transaccionales (PostgreSQL y MongoDB) con un ecosistema analítico que soporte flujos de trabajo pesados y consultas complejas.

Para ello, se añadieron nuevos bloques al archivo `docker-compose.yml` utilizando el perfil `data` para que estos servicios solo se inicien cuando se requiera realizar tareas de análisis, evitando consumir recursos innecesarios en el desarrollo diario.

## 2. Cambios en `docker-compose.yml`
Se integraron los siguientes servicios en la sección de "Infraestructura Analítica":

### 2.1 Apache Airflow (Orquestador)
Airflow se encarga de programar, orquestar y monitorear pipelines de datos (ETLs/ELTs). Se añadieron:
- **postgres-airflow**: Una base de datos PostgreSQL independiente que actúa como el *backend* de Airflow (guarda el estado de las tareas, los DAGs, usuarios, etc.).
- **airflow-init**: Un contenedor temporal que se ejecuta al inicio para inicializar la base de datos de Airflow y crear el usuario administrador (admin/admin).
- **airflow-webserver**: La interfaz gráfica de usuario (UI) accesible en el puerto `8081` (se cambió de 8080 para no chocar con Keycloak).
- **airflow-scheduler**: El componente encargado de planificar las tareas y enviarlas a los *workers*.

### 2.2 Apache Hadoop y Hive (Almacenamiento y Consulta SQL Big Data)
Hive permite realizar consultas tipo SQL sobre grandes conjuntos de datos almacenados en un sistema de archivos distribuido (HDFS de Hadoop).
Para no configurar todo desde cero, se usaron las imágenes preconfiguradas de `bde2020` (Big Data Europe) que facilitan la integración de Hadoop:
- **namenode** y **datanode**: Componentes principales de Hadoop HDFS. El *Namenode* gestiona los metadatos y el *Datanode* almacena los bloques de datos.
- **hive-metastore-postgresql**: Una base de datos PostgreSQL que almacena los metadatos de Hive (estructura de tablas, particiones, etc.).
- **hive-metastore**: El servicio que gestiona la conexión con la base de datos de metadatos mediante Thrift (puerto `9083`).
- **hive-server**: El servidor principal (HiveServer2) que acepta consultas de clientes externos vía JDBC/ODBC (puerto `10000`) y las ejecuta en Hadoop. 

## 3. Decisiones Técnicas Clave y Solución de Errores

### ¿Por qué imágenes `bde2020`?
Configurar un clúster de Hadoop y Hive desde cero en Docker es sumamente complejo por la gran cantidad de variables de entorno (HADOOP_HOME, HIVE_HOME) y archivos XML (`core-site.xml`, `hive-site.xml`). Las imágenes de `bde2020` utilizan scripts inteligentes (como el archivo `hadoop.env`) para inyectar estas configuraciones automáticamente.

### Solución del Error en Hive Metastore (SessionHiveMetaStoreClient)
Al realizar pruebas con el script `init_schema.hql`, nos encontramos con el error de que `hive-server` no podía conectarse con el metastore.
- **Causa:** La base de datos PostgreSQL (`hive-metastore-postgresql`) iniciaba en blanco. Hive requiere que las tablas internas (su "esquema") existan previamente para poder arrancar. Si no las encuentra, el contenedor `hive-metastore` hace "crash" en un ciclo infinito.
- **Solución:** En el archivo `hadoop.env` se modificó la variable `HIVE_SITE_CONF_datanucleus_autoCreateSchema` de `false` a `true`. Esto le dio permiso a Hive para que, al no encontrar las tablas en Postgres, las generara automáticamente.

## 4. Gestión de Recursos y Almacenamiento
Al añadir estos servicios, se generan imágenes de Docker muy pesadas (Hadoop y Airflow combinados pueden superar los 5-8 GB) y volúmenes de datos grandes.
Dado que se configuraron bajo el comando `profiles: ["data"]`, los comandos normales `docker compose up -d` no los levantarán. Solo se ejecutarán con `docker compose --profile data up -d`, lo que permite mantener la PC libre de carga cuando solo se trabaja en la API o el frontend.
