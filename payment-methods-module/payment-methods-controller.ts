import { Request, Response } from "express";
import { PaymentMethod } from "./payment-methods-model";
import {
    IPaymentMethod,
    IPaymentMethodQueryOptions,
    IPaginateParams,
    IApiHandlerResponse
} from "../common/interfaces";
import { getS3Object } from "../common/utils/s3-client";
import * as dotenv from "dotenv";
import { DataBaseTables } from "../common/enums";
import { StatusCodes } from "http-status-codes";

dotenv.config({});

const TABLE_NAME = DataBaseTables.PAYMENT_METHODS.toUpperCase();

export const create = async (
    request: Request,
    response: Response
): Promise<IApiHandlerResponse> => {
    // #swagger.security = [{ "accessBearer": [] }]
    // #swagger.tags = ['payment-method']
    // #swagger.summary = 'Endpoint to create a payment method.'

    const data = request.body as IPaymentMethod;
    const { user } = request;
    data.created_by = user?.id;
    const paymentMethods = await PaymentMethod.create(data);

    if (paymentMethods) {
        return response.status(StatusCodes.OK).json({
            data: paymentMethods,
            message: `${TABLE_NAME} created successfully`
        });
    }

    return response.status(StatusCodes.BAD_REQUEST).json({
        error: `${TABLE_NAME} creation failed`,
        message: `failed to create ${TABLE_NAME}`
    });
};

export const getAll = async (
    request: Request,
    response: Response
): Promise<IApiHandlerResponse> => {
    // #swagger.security = [{ "accessBearer": [] }]
    // #swagger.tags = ['payment-method']
    // #swagger.summary = 'Endpoint to get all payment method.'
    /* #swagger.parameters['per_page'] = {
        in: 'query',
        description: 'Number of items per page.',
        type: 'number',
        default: 10
    } */
    /* #swagger.parameters['current_page'] = {
        in: 'query',
        description: 'Current page number.',
        type: 'number',
        default: 1
    } */

    const { per_page, current_page } =
        request.query as unknown as IPaginateParams;
    if (per_page && current_page) {
        const { data: countries, meta } = await PaymentMethod.getAllPaginate({
            per_page,
            current_page
        });

        return response.status(StatusCodes.OK).json({
            data: countries,
            meta,
            message: `Fetched ${TABLE_NAME} successfully`
        });
    }

    const query: IPaymentMethodQueryOptions = request.query;
    if (query) {
        const countries = await PaymentMethod.getBy(query);
        return response.status(StatusCodes.OK).json({
            data: countries,
            message: `Fetched ${TABLE_NAME} successfully`
        });
    }

    const countries = await PaymentMethod.getAll();
    return response.status(StatusCodes.OK).json({
        data: countries,
        message: `Fetched ${TABLE_NAME} successfully`
    });
};

export const getById = async (
    request: Request,
    response: Response
): Promise<IApiHandlerResponse> => {
    // #swagger.security = [{ "accessBearer": [] }]
    // #swagger.tags = ['payment-method']
    // #swagger.summary = 'Endpoint to get payment method by Id.'

    const paymentMethodId = Number(request.params.id);
    const paymentMethod = await PaymentMethod.getById(paymentMethodId);

    if (!paymentMethod) {
        return response.status(StatusCodes.NOT_FOUND).json({
            error: `${TABLE_NAME} not found`,
            message: `Failed to fetch ${TABLE_NAME}`
        });
    }

    return response.status(StatusCodes.OK).json({
        data: paymentMethod,
        message: `${TABLE_NAME} fetched successfully`
    });
};

export const update = async (
    request: Request,
    response: Response
): Promise<any> => {
    // #swagger.security = [{ "accessBearer": [] }]
    // #swagger.tags = ['payment-method']
    // #swagger.summary = 'Endpoint to update payment method.'

    const id = Number(request.params.id);
    const data = request.body as IPaymentMethod;
    const { user } = request;
    data.updated_by = user?.id;

    await PaymentMethod.update(id, data);
    const paymentMethod = await PaymentMethod.getById(id);

    return response.status(StatusCodes.OK).json({
        data: paymentMethod ? paymentMethod : {},
        message: `${TABLE_NAME} updated successfully`
    });
};

export const destroy = async (
    request: Request,
    response: Response
): Promise<any> => {
    // #swagger.security = [{ "accessBearer": [] }]
    // #swagger.tags = ['payment-method']
    // #swagger.summary = 'Endpoint to delete payment method.'

    const id = Number(request.params.id);

    await PaymentMethod.delete(id);

    return response.status(StatusCodes.NO_CONTENT).json({
        data: {},
        message: `${TABLE_NAME} deleted successfully`
    });
};

export const bulkCreate = async (
    request: Request,
    response: Response
): Promise<any> => {
    // #swagger.security = [{ "accessBearer": [] }]
    // #swagger.tags = ['payment-method']
    // #swagger.summary = 'Endpoint to bulk create payment method.'

    const { key } = request.body;
    const { data: paymentMethodRecords, errors } = await getS3Object({
        Bucket: process.env.AWS_S3_BUCKET_NAME as string,
        Key: key
    });

    if (Array.isArray(errors) && errors.length > 0) {
        return response.status(StatusCodes.BAD_REQUEST).json({
            error: errors.join(", "),
            message: `Failed to trigger bulk create ${TABLE_NAME}`
        });
    }

    const { user } = request;
    paymentMethodRecords?.forEach((record: any) => {
        record.created_by = user?.id;
    });

    const countries = await PaymentMethod.bulkCreate(
        paymentMethodRecords as IPaymentMethod[]
    );

    return response.status(StatusCodes.CREATED).json({
        data: countries,
        message: "Bulk create operation completed"
    });
};

export const bulkDestroy = async (
    request: Request,
    response: Response
): Promise<any> => {
    // #swagger.security = [{ "accessBearer": [] }]
    // #swagger.tags = ['payment-method']
    // #swagger.summary = 'Endpoint to bulk delete payment method.'

    const { ids } = request.body;

    if (Array.isArray(ids) && ids.length > 0) {
        await PaymentMethod.bulkDelete(ids);
        return response.status(StatusCodes.NO_CONTENT).json({
            data: {},
            message: `Failed to delete ${TABLE_NAME}`
        });
    }

    return response.status(StatusCodes.NO_CONTENT).json({
        data: {},
        message: `${TABLE_NAME} deleted successfully`
    });
};
