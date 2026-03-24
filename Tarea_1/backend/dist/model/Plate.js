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
exports.Plate = void 0;
const typeorm_1 = require("typeorm");
const Menu_1 = require("./Menu");
const OrderItem_1 = require("./OrderItem");
let Plate = class Plate {
};
exports.Plate = Plate;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], Plate.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Plate.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)("decimal"),
    __metadata("design:type", Number)
], Plate.prototype, "price", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Plate.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Menu_1.Menu, menu => menu.plates),
    (0, typeorm_1.JoinColumn)({ name: "menu_id" }),
    __metadata("design:type", Menu_1.Menu)
], Plate.prototype, "menu", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => OrderItem_1.OrderItem, item => item.plate),
    __metadata("design:type", Array)
], Plate.prototype, "orderItems", void 0);
exports.Plate = Plate = __decorate([
    (0, typeorm_1.Entity)()
], Plate);
