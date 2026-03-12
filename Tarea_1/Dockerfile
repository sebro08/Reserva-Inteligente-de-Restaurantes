FROM node:20-alpine AS build

WORKDIR /usr/src/app

# Esta primera etapa existe solo para compilar TypeScript.
# La idea es separar la fase de construccion de la fase de ejecucion.
COPY backend/package*.json ./
RUN npm ci

COPY backend/tsconfig.json ./
COPY backend/src ./src

RUN npm run build

FROM node:20-alpine AS runtime

WORKDIR /usr/src/app

# En la imagen final solo dejamos lo necesario para correr la API.
# Asi evitamos meter codigo fuente y dependencias de desarrollo que no hacen falta.
COPY backend/package*.json ./
RUN npm ci --omit=dev

COPY --from=build /usr/src/app/dist ./dist

EXPOSE 3000

# El proyecto real vive en backend.
# Por eso Docker toma ese codigo, lo compila y luego arranca solo la version final.
CMD ["npm", "start"]