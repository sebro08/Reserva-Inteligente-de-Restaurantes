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
