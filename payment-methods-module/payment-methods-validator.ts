import * as Joi from "joi";
import { Request, Response, NextFunction } from "express";
import { PaymentMethod } from "./payment-methods-model";

const merchantIdInUse = async (merchant_id: string) =>
    Object.keys(await PaymentMethod.getBy({ merchant_id })).length > 0;

const schema = Joi.object({
    name: Joi.string().required().min(6),
    description: Joi.string().required(),
    merchant_id: Joi.string().required(),
    secret_key: Joi.string().required(),
    hash_type_id: Joi.number().required(),
    activated: Joi.boolean()
});

export const validateCreateRequest = async (
    request: Request,
    response: Response,
    next: NextFunction
) => {
    try {
        if (await merchantIdInUse(request.body.merchant_id)) {
            return response
                .status(422)
                .json({ data: { message: "merchant_id in use" } });
        }

        const {
            name,
            description,
            merchant_id,
            secret_key,
            hash_type_id,
            activated
        } = request.body;
        await schema.validateAsync({
            name,
            description,
            merchant_id,
            secret_key,
            hash_type_id,
            activated
        });

        next();
    } catch (error) {
        return response.status(422).json({ error });
    }
};

export const validateUpdateRequest = async (
    request: Request,
    response: Response,
    next: NextFunction
) => {
    try {
        const {
            name,
            description,
            merchant_id,
            secret_key,
            hash_type_id,
            activated
        } = request.body;
        await schema.validateAsync({
            name,
            description,
            merchant_id,
            secret_key,
            hash_type_id,
            activated
        });

        next();
    } catch (error) {
        return response.status(422).json({ error });
    }
};

export const validateRequestWithId = async (
    request: Request,
    response: Response,
    next: NextFunction
) => {
    try {
        const { id } = request.params;
        if (!id) {
            return response
                .status(422)
                .json({ error: "id params is required" });
        }

        next();
    } catch (error) {
        return response.status(422).json({ error });
    }
};
