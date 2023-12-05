import { Request, Response } from "express";
import * as dotenv from "dotenv";
import {
    IApiHandlerResponse,
    IBillplzCallback,
    IFinancialCollection,
    IPayment
} from "../common/interfaces";
import { StatusCodes } from "http-status-codes";
import { PaymentMethod } from "../payment-methods-module/payment-methods-model";
import axios from "axios";
import { FinancialCollection } from "../financial-module/financial-collections/financial-collections-model";
import { createHmac } from "crypto";
import { customAlphabet } from "nanoid/async";
import Chip from "Chip";
import Stripe from "stripe";

const nanoid = customAlphabet("1234567890", 11);

dotenv.config({});

const generateBillplzUrl = async (
    name: string,
    email: string,
    mobile_number: string,
    amount: number,
    description: string
): Promise<string | null> => {
    const payload = {
        collection_id: process.env.BILLPLZ_COLLECTION_CODE,
        email,
        mobile: mobile_number,
        name,
        amount: parseInt((amount * 100).toFixed(0)),
        callback_url: `${process.env.BILLPLZ_CALLBACK_URL}`,
        description,
        reference_1_label: "",
        reference_1: "",
        reference_2_label: "",
        reference_2: ""
    };

    // const paymentMethods = await PaymentMethod.getBy({
    //     where: { name: "Billplz" }
    // });
    // const paymentMethod = paymentMethods.length > 0 ? paymentMethods[0] : null;
    // if (!paymentMethod) {
    //     throw new Error("Unable to process payment");
    // }
    // const merchantId = paymentMethod.merchant_id as string;
    const merchantId = process.env.BILLPLZ_MERCHANT_ID as string;

    const url = `${process.env.BILLPLZ_URL}/bills`;
    const encodeMerchantId = Buffer.from(merchantId).toString("base64");
    const headers = {
        Authorization: `Basic ${encodeMerchantId}`,
        Accept: "application/json"
    };

    try {
        const response = await axios.post(url, payload, { headers });

        return response.data.url;
    } catch (error) {
        console.error(error);
    }
    return null;
};

const generateRandomOrderId = async (): Promise<string> => {
    const date = new Date();
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, "0"); // Month is zero-based
    const day = date.getDate().toString().padStart(2, "0");

    const random = await nanoid();

    return `${year}${month}${day}${random}`;
};

const generateSenangPayUrl = async (
    name: string,
    email: string,
    mobile_number: string,
    amount: number,
    description: string
): Promise<string | null> => {
    // const paymentMethods = await PaymentMethod.getBy({
    //     where: { name: "SenangPay" }
    // });
    // const paymentMethod = paymentMethods.length > 0 ? paymentMethods[0] : null;
    // if (!paymentMethod) {
    //     throw new Error("Unable to process payment");
    // }

    const orderId = await generateRandomOrderId();

    const str = `${
        process.env.SENANGPAY_SECRET_KEY
    }${description}${amount.toFixed(2)}${orderId}`;
    const hmacValue = createHmac(
        "sha256",
        process.env.SENANGPAY_SECRET_KEY as string
    )
        .update(str)
        .digest("hex");

    const url = `${process.env.SENANGPAY_URL}/payment/${process.env.SENANGPAY_MERCHANT_ID}`;

    try {
        const paymentUrl = `${url}?detail=${description}&amount=${amount.toFixed(
            2
        )}&order_id=${orderId}&hash=${hmacValue}&name=${name}&email=${email}&phone=${mobile_number}`;

        return paymentUrl;
    } catch (error) {
        console.error(error);
    }
    return null;
};

const chipCreatePurchase = async (payload: any): Promise<any> => {
    Chip.ApiClient.instance.basePath = process.env.CHIP_URL as string;
    Chip.ApiClient.instance.token = process.env.CHIP_SECRET_KEY as string;
    const chipApiInstance = new Chip.PaymentApi();

    return new Promise((resolve, reject) => {
        chipApiInstance.purchasesCreate(
            payload as any,
            (error, data, response) => {
                if (error) {
                    reject(error);
                }
                resolve(data);
            }
        );
    });
};

const generateChipUrl = async (
    name: string,
    email: string,
    mobile_number: string,
    amount: number,
    description: string
): Promise<string | null> => {
    const client = { email, phone: mobile_number, full_name: name };
    const product = {
        name: description,
        price: parseInt((amount * 100).toFixed(0))
    };
    const details = { products: [product] };
    const payload = {
        brand_id: process.env.CHIP_MERCHANT_ID as string,
        client: client,
        purchase: details,
        success_redirect: process.env.CHIP_SUCCESS_URL as string,
        failure_redirect: process.env.CHIP_CANCEL_URL as string,
        success_callback: process.env.CHIP_CALLBACK_URL as string
    };

    try {
        const data = await chipCreatePurchase(payload);
        console.log(data);
        if (data && data.checkout_url) {
            return data.checkout_url;
        }

        return null;
    } catch (error) {
        console.error(error);
    }
    return null;
};

const generateStripeUrl = async (
    name: string,
    email: string,
    mobile_number: string,
    amount: number,
    description: string,
    country: string
): Promise<string | null> => {
    let currency = "myr";
    let secretKey = process.env.STRIPE_MY_SECRET_KEY as string;
    let successUrl = process.env.STRIPE_MY_SUCCESS_URL as string;
    let callbackUrl = process.env.STRIPE_MY_CALLBACK_URL as string;

    if (country === "sg") {
        currency = "sgd";
        secretKey = process.env.STRIPE_SG_SECRET_KEY as string;
        successUrl = process.env.STRIPE_SG_SUCCESS_URL as string;
        callbackUrl = process.env.STRIPE_SG_CALLBACK_URL as string;
    }

    const stripe = new Stripe(secretKey, {
        apiVersion: "2023-08-16",
        typescript: true
    });

    try {
        const customer = await stripe.customers.create({
            name,
            email,
            phone: mobile_number
        });

        const stripeCheckout = await stripe.checkout.sessions.create({
            line_items: [
                {
                    price_data: {
                        currency,
                        unit_amount: parseInt((amount * 100).toFixed(0)),
                        product_data: {
                            name: description
                        }
                    },
                    quantity: 1
                }
            ],
            mode: "payment",
            success_url: successUrl,
            cancel_url: callbackUrl,
            currency,
            customer_email: email,
            customer: customer?.id ?? undefined
        });

        return stripeCheckout.url;
    } catch (error) {
        console.error(error);
    }
    return null;
};

export const generatePaymentUrl = async (
    request: Request,
    response: Response
): Promise<IApiHandlerResponse> => {
    // #swagger.security = [{ "accessBearer": [] }]
    // #swagger.tags = ['payment']
    // #swagger.summary = 'Endpoint to generate a payment url.'

    const { gatewayType, name, email, mobile_number, amount, description } =
        request.body as IPayment;
    let paymentUrl = null;

    switch (gatewayType) {
        case "billplz": {
            paymentUrl = await generateBillplzUrl(
                name,
                email,
                mobile_number,
                amount,
                description
            );
            break;
        }
        case "senangpay": {
            paymentUrl = await generateSenangPayUrl(
                name,
                email,
                mobile_number,
                amount,
                description
            );
            break;
        }
        case "chip": {
            paymentUrl = await generateChipUrl(
                name,
                email,
                mobile_number,
                amount,
                description
            );
            break;
        }
        case "stripe-my": {
            paymentUrl = await generateStripeUrl(
                name,
                email,
                mobile_number,
                amount,
                description,
                "my"
            );
            break;
        }
        case "stripe-sg": {
            paymentUrl = await generateStripeUrl(
                name,
                email,
                mobile_number,
                amount,
                description,
                "sg"
            );
            break;
        }
        default:
            break;
    }

    if (paymentUrl) {
        return response.status(StatusCodes.OK).json({
            data: paymentUrl,
            message: `Payment Url created successfully`
        });
    }

    return response.status(StatusCodes.BAD_REQUEST).json({
        error: `Payment URL creation failed`,
        message: `failed to create payment URL.`
    });
};

export const paymentBillplzCallback = async (
    request: Request,
    response: Response
): Promise<IApiHandlerResponse> => {
    // #swagger.tags = ['payment']
    // #swagger.summary = 'Endpoint for Billplz callback.'

    const {
        id,
        collection_id,
        paid,
        state,
        amount,
        paid_amount,
        due_at,
        email,
        mobile,
        name,
        url,
        paid_at,
        transaction_id,
        transaction_status,
        x_signature
    } = request.body as IBillplzCallback;

    if (paid && state === "paid") {
        const collection: IFinancialCollection = {
            full_name: name,
            ref_no: id,
            payment_email: email,
            contact_number: mobile,
            code: "",
            transaction_date: new Date(paid_at),
            invoice_number: id,
            bill_id: id,
            processor: "",
            amount_paid: Number(paid_amount) / 100,
            transaction_fee: 0,
            amount_received: Number(paid_amount) / 100,
            payout: 0,
            payment_method_id: 1,
            order_id: 0
        };
        await FinancialCollection.create(collection);
    }

    return response.status(StatusCodes.OK).json({
        message: `Payment successful`
    });
};
