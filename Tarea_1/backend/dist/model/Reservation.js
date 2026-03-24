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
exports.Reservation = void 0;
const typeorm_1 = require("typeorm");
const User_1 = require("./User");
const Restaurant_1 = require("./Restaurant");
const RestaurantTable_1 = require("./RestaurantTable");
const Status_1 = require("./Status");
let Reservation = class Reservation {
};
exports.Reservation = Reservation;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], Reservation.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "date" }),
    __metadata("design:type", Date)
], Reservation.prototype, "reservation_date", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "time" }),
    __metadata("design:type", String)
], Reservation.prototype, "reservation_time", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], Reservation.prototype, "people_count", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Status_1.Status),
    (0, typeorm_1.JoinColumn)({ name: "status_id" }),
    __metadata("design:type", Status_1.Status)
], Reservation.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => User_1.User, user => user.reservations),
    (0, typeorm_1.JoinColumn)({ name: "user_id" }),
    __metadata("design:type", User_1.User)
], Reservation.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Restaurant_1.Restaurant, restaurant => restaurant.reservations),
    (0, typeorm_1.JoinColumn)({ name: "restaurant_id" }),
    __metadata("design:type", Restaurant_1.Restaurant)
], Reservation.prototype, "restaurant", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => RestaurantTable_1.RestaurantTable, table => table.reservations),
    (0, typeorm_1.JoinColumn)({ name: "restaurant_table_id" }),
    __metadata("design:type", RestaurantTable_1.RestaurantTable)
], Reservation.prototype, "table", void 0);
exports.Reservation = Reservation = __decorate([
    (0, typeorm_1.Entity)()
], Reservation);
