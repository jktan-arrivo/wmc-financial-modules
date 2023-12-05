import * as Joi from "joi";
import { Request, Response, NextFunction } from "express";

const schema = Joi.object({
    name: Joi.string().required().min(6),
    code: Joi.string().required(),
    symbol: Joi.string().required(),
    activated: Joi.boolean()
});

export const validateCreateRequest = async (
    request: Request,
    response: Response,
    next: NextFunction
) => {
    try {
        const { name, activated, code, symbol } = request.body;
        await schema.validateAsync({
            name,
            code,
            symbol,
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
        const { name, code, symbol } = request.body;
        await schema.validateAsync({ name, code, symbol });

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
