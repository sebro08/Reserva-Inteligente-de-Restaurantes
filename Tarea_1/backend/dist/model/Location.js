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
exports.Location = void 0;
const typeorm_1 = require("typeorm");
const District_1 = require("./District");
const Restaurant_1 = require("./Restaurant");
const Order_1 = require("./Order");
let Location = class Location {
};
exports.Location = Location;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], Location.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Location.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => District_1.District, district => district.locations),
    (0, typeorm_1.JoinColumn)({ name: "district_id" }),
    __metadata("design:type", District_1.District)
], Location.prototype, "district", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => Restaurant_1.Restaurant, restaurant => restaurant.location),
    __metadata("design:type", Array)
], Location.prototype, "restaurants", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => Order_1.Order, order => order.location),
    __metadata("design:type", Array)
], Location.prototype, "orders", void 0);
exports.Location = Location = __decorate([
    (0, typeorm_1.Entity)()
], Location);
