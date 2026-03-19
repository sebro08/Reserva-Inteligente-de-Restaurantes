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
exports.Canton = void 0;
const typeorm_1 = require("typeorm");
const Province_1 = require("./Province");
const District_1 = require("./District");
let Canton = class Canton {
};
exports.Canton = Canton;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], Canton.prototype, "code", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Canton.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Province_1.Province, province => province.cantons),
    (0, typeorm_1.JoinColumn)({ name: "province_id" }),
    __metadata("design:type", Province_1.Province)
], Canton.prototype, "province", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => District_1.District, district => district.canton),
    __metadata("design:type", Array)
], Canton.prototype, "districts", void 0);
exports.Canton = Canton = __decorate([
    (0, typeorm_1.Entity)()
], Canton);
