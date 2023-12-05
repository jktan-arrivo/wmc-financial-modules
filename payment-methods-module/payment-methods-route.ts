import { Router } from "express";
import * as paymentMethodsController from "./payment-methods-controller";
import {
    validateCreateRequest,
    validateUpdateRequest,
    validateRequestWithId
} from "./payment-methods-validator";
import { verifyAccessToken } from "../common/middlewares";
export const paymentMethodsRoutes: Router = Router();

paymentMethodsRoutes.get(
    "/api/payment-method",
    verifyAccessToken,
    paymentMethodsController.getAll
);

paymentMethodsRoutes.post(
    "/api/payment-method",
    verifyAccessToken,
    validateCreateRequest,
    paymentMethodsController.create
);

paymentMethodsRoutes.get(
    "/api/payment-method/:id",
    verifyAccessToken,
    validateRequestWithId,
    paymentMethodsController.getById
);

paymentMethodsRoutes.patch(
    "/api/payment-method/:id",
    verifyAccessToken,
    validateUpdateRequest,
    paymentMethodsController.update
);

paymentMethodsRoutes.delete(
    "/api/payment-method/:id",
    verifyAccessToken,
    validateRequestWithId,
    paymentMethodsController.destroy
);

paymentMethodsRoutes.post(
    "/api/bulk/payment-method",
    verifyAccessToken,
    paymentMethodsController.bulkCreate
);

paymentMethodsRoutes.delete(
    "/api/bulk/payment-method",
    verifyAccessToken,
    paymentMethodsController.bulkDestroy
);
