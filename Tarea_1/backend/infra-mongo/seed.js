db = db.getSiblingDB('restaurant_db');

db.roles.insertMany([
  { id: 1, name: 'Admin' },
  { id: 2, name: 'User' }
]);

db.statuses.insertMany([
  { id: 10, name: 'Pending' },
  { id: 11, name: 'Confirmed' },
  { id: 12, name: 'Cancelled' },
  { id: 13, name: 'Completed' },
  { id: 20, name: 'Preparing' },
  { id: 21, name: 'Ready' },
  { id: 22, name: 'Delivered' },
  { id: 30, name: 'Pending' },
  { id: 31, name: 'Confirmed' },
  { id: 32, name: 'Cancelled' },
  { id: 33, name: 'Checked-in' },
  { id: 34, name: 'Completed' }
]);

print("Roles y Statuses insertados.");

// =============================================================================
// DATOS TRANSACCIONALES (espejo del seed de PostgreSQL 05_transactional.sql)
// Para que la base Mongo tenga los mismos datos que necesita el pipeline.
// Nombres de coleccion segun el codigo del backend:
//   users, orders, menus (plural) y plate (singular, shardeada por menu_id).
// Las ordenes EMBEBEN sus items en un arreglo 'items' (estilo documental),
// a diferencia de Postgres que usa la tabla order_item.
// =============================================================================

// Limpieza para poder re-ejecutar sin duplicar
db.categories.deleteMany({});
db.locations.deleteMany({});
db.users.deleteMany({});
db.restaurants.deleteMany({});
db.menus.deleteMany({});
db.plate.deleteMany({});
db.orders.deleteMany({});

db.categories.insertMany([
  { id: 1, name: 'Entradas' },
  { id: 2, name: 'Platos Fuertes' },
  { id: 3, name: 'Postres' },
  { id: 4, name: 'Bebidas' },
  { id: 5, name: 'Ensaladas' },
  { id: 6, name: 'Sopas' }
]);

db.locations.insertMany([
  { id: 1,  name: 'Centro San Jose',   district_id: 10101 },
  { id: 2,  name: 'Escazu',            district_id: 10201 },
  { id: 3,  name: 'Desamparados',      district_id: 10301 },
  { id: 4,  name: 'Zapote',            district_id: 10105 },
  { id: 5,  name: 'Pavas',             district_id: 10109 },
  { id: 6,  name: 'Merced',            district_id: 10102 },
  { id: 7,  name: 'Hospital',          district_id: 10103 },
  { id: 8,  name: 'Catedral',          district_id: 10104 },
  { id: 9,  name: 'San Francisco de Dos Rios', district_id: 10106 },
  { id: 10, name: 'Uruca',             district_id: 10107 },
  { id: 11, name: 'Mata Redonda',      district_id: 10108 },
  { id: 12, name: 'Hatillo',           district_id: 10110 },
  { id: 13, name: 'San Sebastian',     district_id: 10111 },
  { id: 14, name: 'San Antonio (Escazu)', district_id: 10202 },
  { id: 15, name: 'San Rafael (Escazu)',  district_id: 10203 },
  { id: 16, name: 'San Miguel (Desamparados)', district_id: 10302 },
  { id: 17, name: 'San Juan de Dios',  district_id: 10303 },
  { id: 18, name: 'Frailes',           district_id: 10306 },
  { id: 19, name: 'Aserri',            district_id: 10601 },
  { id: 20, name: 'Curridabat',        district_id: 11801 },
  { id: 21, name: 'Granadilla',        district_id: 11802 },
  { id: 22, name: 'Guadalupe',         district_id: 10801 },
  { id: 23, name: 'San Francisco (Goicoechea)', district_id: 10802 },
  { id: 24, name: 'San Pedro (Montes de Oca)', district_id: 11501 },
  { id: 25, name: 'Sabanilla',         district_id: 11502 },
  { id: 26, name: 'Santa Ana',         district_id: 10901 },
  { id: 27, name: 'Alajuelita',        district_id: 11001 },
  { id: 28, name: 'Tibas (Cinco Esquinas)', district_id: 11302 },
  { id: 29, name: 'Moravia (San Vicente)',  district_id: 11401 },
  { id: 30, name: 'Vazquez de Coronado (San Isidro)', district_id: 11101 }
]);

// Reasigna cada orden a una ubicacion aleatoria entre las 30 disponibles
db.orders.find().forEach(function(order) {
  const randomLocationId = Math.floor(Math.random() * 30) + 1;
  db.orders.updateOne(
    { _id: order._id },
    { $set: { location_id: randomLocationId } }
  );
});

db.users.insertMany([
  { id: 1,  keycloak_id: 'kc-admin-001', first_name: 'Admin',   last_name: 'Principal', email: 'admin@resto.com',  is_active: true, created_at: new Date('2025-08-01T09:00:00Z'), role_id: 1 },
  { id: 2,  keycloak_id: 'kc-user-002',  first_name: 'Carlos',  last_name: 'Jimenez',   email: 'carlos@mail.com',  is_active: true, created_at: new Date('2025-08-10T10:15:00Z'), role_id: 2 },
  { id: 3,  keycloak_id: 'kc-user-003',  first_name: 'Maria',   last_name: 'Rodriguez', email: 'maria@mail.com',   is_active: true, created_at: new Date('2025-08-18T11:30:00Z'), role_id: 2 },
  { id: 4,  keycloak_id: 'kc-user-004',  first_name: 'Jose',    last_name: 'Vargas',    email: 'jose@mail.com',    is_active: true, created_at: new Date('2025-09-02T14:00:00Z'), role_id: 2 },
  { id: 5,  keycloak_id: 'kc-user-005',  first_name: 'Ana',     last_name: 'Mora',      email: 'ana@mail.com',     is_active: true, created_at: new Date('2025-09-15T16:45:00Z'), role_id: 2 },
  { id: 6,  keycloak_id: 'kc-user-006',  first_name: 'Luis',    last_name: 'Castro',    email: 'luis@mail.com',    is_active: true, created_at: new Date('2025-10-01T12:20:00Z'), role_id: 2 },
  { id: 7,  keycloak_id: 'kc-user-007',  first_name: 'Sofia',   last_name: 'Solano',    email: 'sofia@mail.com',   is_active: true, created_at: new Date('2025-10-20T18:05:00Z'), role_id: 2 },
  { id: 8,  keycloak_id: 'kc-user-008',  first_name: 'Diego',   last_name: 'Araya',     email: 'diego@mail.com',   is_active: true, created_at: new Date('2025-11-05T19:30:00Z'), role_id: 2 },
  { id: 9,  keycloak_id: 'kc-user-009',  first_name: 'Laura',   last_name: 'Cordero',   email: 'laura@mail.com',   is_active: true, created_at: new Date('2025-11-25T13:10:00Z'), role_id: 2 },
  { id: 10, keycloak_id: 'kc-user-010',  first_name: 'Pedro',   last_name: 'Rojas',     email: 'pedro@mail.com',   is_active: true, created_at: new Date('2025-12-10T20:00:00Z'), role_id: 2 },
  { id: 11, keycloak_id: 'kc-user-011',  first_name: 'Valeria', last_name: 'Nunez',     email: 'valeria@mail.com', is_active: true, created_at: new Date('2026-01-15T11:00:00Z'), role_id: 2 },
  { id: 12, keycloak_id: 'kc-user-012',  first_name: 'Andres',  last_name: 'Quiros',    email: 'andres@mail.com',  is_active: true, created_at: new Date('2026-02-01T12:45:00Z'), role_id: 2 }
]);

db.restaurants.insertMany([
  { id: 1, name: 'Soda La Tablita',        created_at: new Date('2025-08-05T10:00:00Z'), location_id: 1, admin_id: 1 },
  { id: 2, name: 'Restaurante Sabor Tico', created_at: new Date('2025-08-08T10:00:00Z'), location_id: 2, admin_id: 1 },
  { id: 3, name: 'El Fogon Criollo',       created_at: new Date('2025-08-12T10:00:00Z'), location_id: 3, admin_id: 1 }
]);

db.menus.insertMany([
  { id: 1, name: 'Menu Principal - La Tablita', restaurant_id: 1 },
  { id: 2, name: 'Menu Principal - Sabor Tico', restaurant_id: 2 },
  { id: 3, name: 'Menu Principal - El Fogon',   restaurant_id: 3 }
]);

db.plate.insertMany([
  { id: 1,  name: 'Casado con Pollo',   price: 3500, description: 'Arroz, frijoles, ensalada y pollo',    menu_id: 1, category_id: 2 },
  { id: 2,  name: 'Casado con Carne',   price: 4200, description: 'Arroz, frijoles, ensalada y carne',    menu_id: 1, category_id: 2 },
  { id: 3,  name: 'Gallo Pinto',        price: 2500, description: 'Arroz y frijoles con natilla',         menu_id: 1, category_id: 1 },
  { id: 4,  name: 'Arroz con Pollo',    price: 3800, description: 'Clasico arroz con pollo tico',         menu_id: 1, category_id: 2 },
  { id: 5,  name: 'Ceviche de Pescado', price: 4500, description: 'Pescado fresco en limon',              menu_id: 1, category_id: 1 },
  { id: 6,  name: 'Sopa Negra',         price: 2800, description: 'Sopa de frijoles con huevo',           menu_id: 1, category_id: 6 },
  { id: 7,  name: 'Tres Leches',        price: 2200, description: 'Postre humedo de tres leches',         menu_id: 2, category_id: 3 },
  { id: 8,  name: 'Flan de Coco',       price: 2000, description: 'Flan casero de coco',                  menu_id: 2, category_id: 3 },
  { id: 9,  name: 'Batido de Mora',     price: 1800, description: 'Batido natural de mora',               menu_id: 2, category_id: 4 },
  { id: 10, name: 'Cafe Chorreado',     price: 1200, description: 'Cafe tradicional chorreado',           menu_id: 2, category_id: 4 },
  { id: 11, name: 'Ensalada Cesar',     price: 3200, description: 'Lechuga, crotones y aderezo cesar',    menu_id: 2, category_id: 5 },
  { id: 12, name: 'Ensalada Tropical',  price: 3000, description: 'Mix de frutas y vegetales',            menu_id: 2, category_id: 5 },
  { id: 13, name: 'Olla de Carne',      price: 5200, description: 'Caldo de carne con vegetales',         menu_id: 3, category_id: 6 },
  { id: 14, name: 'Chifrijo',           price: 3900, description: 'Frijoles, chicharron y pico de gallo', menu_id: 3, category_id: 1 },
  { id: 15, name: 'Patacones',          price: 2600, description: 'Platano verde frito',                  menu_id: 3, category_id: 1 },
  { id: 16, name: 'Pollo a la Plancha', price: 4400, description: 'Pechuga a la plancha con guarnicion',  menu_id: 3, category_id: 2 },
  { id: 17, name: 'Pescado Entero',     price: 6500, description: 'Pescado frito entero',                 menu_id: 3, category_id: 2 },
  { id: 18, name: 'Limonada Natural',   price: 1500, description: 'Limonada con o sin soda',              menu_id: 3, category_id: 4 }
]);

// --- Generacion de ordenes con items embebidos -----------------------------
const baseDate = new Date('2025-09-01T00:00:00Z');
const ordenes = [];

for (let i = 1; i <= 240; i++) {
  // Fecha sesgada hacia meses recientes
  const dias = Math.floor(Math.pow(Math.random(), 0.7) * 280);

  // Hora: 40% almuerzo (11-14), 35% cena (18-21), 25% resto
  const rHora = Math.random();
  let hora;
  if (rHora < 0.40)      hora = 11 + Math.floor(Math.random() * 4);
  else if (rHora < 0.75) hora = 18 + Math.floor(Math.random() * 4);
  else                   hora = Math.floor(Math.random() * 24);
  const minutos = Math.floor(Math.random() * 60);

  const createdAt = new Date(
    baseDate.getTime()
    + dias * 86400000
    + hora * 3600000
    + minutos * 60000
  );

  // Estado: 65% Completed, 13% Delivered, 10% Cancelled, 7% Confirmed, 5% Pending
  const rEstado = Math.random();
  let statusId;
  if (rEstado < 0.65)      statusId = 13;
  else if (rEstado < 0.78) statusId = 22;
  else if (rEstado < 0.88) statusId = 12;
  else if (rEstado < 0.95) statusId = 11;
  else                     statusId = 10;

  // Items embebidos: 1 a 3, plato sesgado hacia ids bajos (mas populares)
  const numItems = 1 + Math.floor(Math.random() * 3);
  const items = [];
  for (let j = 0; j < numItems; j++) {
    items.push({
      plate_id: 1 + Math.floor(Math.pow(Math.random(), 1.8) * 18),
      quantity: 1 + Math.floor(Math.pow(Math.random(), 1.5) * 4)
    });
  }

  ordenes.push({
    id: i,
    pickup: Math.random() < 0.5,
    created_at: createdAt,
    location_id: 1 + Math.floor(Math.random() * 5),
    status_id: statusId,
    user_id: 2 + Math.floor(Math.random() * 11),
    restaurant_id: 1 + Math.floor(Math.random() * 3),
    items: items
  });
}

db.orders.insertMany(ordenes);

print("Datos transaccionales insertados en Mongo:");
print("  usuarios: " + db.users.countDocuments());
print("  platos:   " + db.plate.countDocuments());
print("  ordenes:  " + db.orders.countDocuments());
