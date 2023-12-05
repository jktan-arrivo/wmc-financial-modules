import {
    IPaginateParams,
    IPagination,
    IPaymentMethod,
    IPaymentMethodQueryOptions
} from "../common/interfaces";
import db from "../common/prisma.module";

export class PaymentMethod {
    static setTable() {
        return db.paymentMethod;
    }

    static async getAll() {
        const data = await this.setTable().findMany();
        return data;
    }

    static async getAllPaginate(params: IPaginateParams) {
        const per_page = Number(params.per_page);
        const current_page = Number(params.current_page);
        const data = await this.setTable().findMany({
            take: per_page,
            skip: (per_page * (current_page - 1)) as number
        });

        const count = await this.setTable().count();
        const pages = Math.ceil(count / per_page);

        const pagination: IPagination = {
            total: count,
            last_page: pages,
            current_page: current_page,
            per_page: per_page,
            from: per_page * (current_page - 1) + 1,
            to: per_page * current_page
        };
        return {
            data,
            meta: pagination
        };
    }

    static async getById(id: number) {
        return await this.setTable().findUnique({
            where: {
                id
            }
        });
    }

    static async getBy(options: IPaymentMethodQueryOptions) {
        const where = {};
        for (const key in options) {
            if (options[key]) {
                (where as any)[key] = {
                    contains: options[key],
                    mode: "insensitive"
                };
            }
        }

        return await this.setTable().findMany({
            where
        });
    }

    static async create(data: IPaymentMethod) {
        return await this.setTable().create({
            data: data as any
        });
    }

    static async bulkCreate(data: Array<IPaymentMethod>) {
        const paymentMethods = data as IPaymentMethod[];
        return await this.setTable().createMany({
            data: paymentMethods as any
        });
    }

    static async update(id: number, entityModel: IPaymentMethod) {
        return await this.setTable().update({
            where: {
                id
            },
            data: entityModel
        });
    }

    static async delete(id: number) {
        return await this.setTable().delete({
            where: {
                id
            }
        });
    }

    static async bulkDelete(ids: number[]) {
        return await this.setTable().deleteMany({
            where: {
                id: {
                    in: ids
                }
            }
        });
    }
}
