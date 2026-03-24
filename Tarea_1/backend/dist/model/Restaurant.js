"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Restaurant = void 0;
const typeorm_1 = require("typeorm");
const Location_1 = require("./Location");
const User_1 = require("./User");
const RestaurantTable_1 = require("./RestaurantTable");
const Menu_1 = require("./Menu");
const Reservation_1 = require("./Reservation");
const Order_1 = require("./Order");
let Restaurant = class Restaurant {
};
exports.Restaurant = Restaurant;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], Restaurant.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Restaurant.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "timestamp" }),
    __metadata("design:type", Date)
], Restaurant.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Location_1.Location, location => location.restaurants),
    (0, typeorm_1.JoinColumn)({ name: "location_id" }),
    __metadata("design:type", Location_1.Location)
], Restaurant.prototype, "location", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => User_1.User, user => user.restaurants),
    (0, typeorm_1.JoinColumn)({ name: "admin_id" }),
    __metadata("design:type", User_1.User)
], Restaurant.prototype, "admin", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => RestaurantTable_1.RestaurantTable, table => table.restaurant),
    __metadata("design:type", Array)
], Restaurant.prototype, "tables", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => Menu_1.Menu, menu => menu.restaurant),
    __metadata("design:type", Array)
], Restaurant.prototype, "menus", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => Reservation_1.Reservation, reservation => reservation.restaurant),
    __metadata("design:type", Array)
], Restaurant.prototype, "reservations", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => Order_1.Order, order => order.restaurant),
    __metadata("design:type", Array)
], Restaurant.prototype, "orders", void 0);
exports.Restaurant = Restaurant = __decorate([
    (0, typeorm_1.Entity)()
], Restaurant);
