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
exports.RestaurantTable = void 0;
const typeorm_1 = require("typeorm");
const Restaurant_1 = require("./Restaurant");
const Reservation_1 = require("./Reservation");
let RestaurantTable = class RestaurantTable {
};
exports.RestaurantTable = RestaurantTable;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], RestaurantTable.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], RestaurantTable.prototype, "capacity", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Restaurant_1.Restaurant, restaurant => restaurant.tables),
    (0, typeorm_1.JoinColumn)({ name: "restaurant_id" }),
    __metadata("design:type", Restaurant_1.Restaurant)
], RestaurantTable.prototype, "restaurant", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => Reservation_1.Reservation, reservation => reservation.table),
    __metadata("design:type", Array)
], RestaurantTable.prototype, "reservations", void 0);
exports.RestaurantTable = RestaurantTable = __decorate([
    (0, typeorm_1.Entity)()
], RestaurantTable);
