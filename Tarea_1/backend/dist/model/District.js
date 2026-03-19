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
exports.District = void 0;
const typeorm_1 = require("typeorm");
const Canton_1 = require("./Canton");
const Location_1 = require("./Location");
let District = class District {
};
exports.District = District;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], District.prototype, "code", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Canton_1.Canton, canton => canton.districts),
    (0, typeorm_1.JoinColumn)({ name: "canton_id" }),
    __metadata("design:type", Canton_1.Canton)
], District.prototype, "canton", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], District.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => Location_1.Location, location => location.district),
    __metadata("design:type", Array)
], District.prototype, "locations", void 0);
exports.District = District = __decorate([
    (0, typeorm_1.Entity)()
], District);
