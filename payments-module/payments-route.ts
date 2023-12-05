import { Router } from "express";
import * as paymentsController from "./payments-controller";
export const paymentsRoutes: Router = Router();
import { verifyAccessToken } from "../common/middlewares";

paymentsRoutes.post(
    "/api/payment/generate",
    verifyAccessToken,
    paymentsController.generatePaymentUrl
);
paymentsRoutes.post(
    "/api/payment/callback/billplz",
    paymentsController.paymentBillplzCallback
);
