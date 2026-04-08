// src/lib/webpay/webpay.service.ts

import { WebpayPlus } from 'transbank-sdk';
import { Options, IntegrationCommerceCodes, IntegrationApiKeys, Environment } from 'transbank-sdk';

// Type definitions for Webpay responses
interface CreateTransactionRequest {
    buy_order: string;
    session_id: string;
    amount: number;
    return_url: string;
}

interface CreateTransactionResponse {
    token: string;
    url: string;
}

interface CommitTransactionResponse {
    vci: string;
    amount: number;
    status: string;
    buy_order: string;
    session_id: string;
    card_detail?: {
        card_number: string;
    };
    accounting_date: string;
    transaction_date: string;
    authorization_code: string;
    payment_type_code: string;
    response_code: number;
    installments_number: number;
}

interface RefundTransactionResponse {
    type: string;
    authorization_code: string;
    authorization_date: string;
    nullified_amount: number;
    balance: number;
    response_code: number;
}

// Initialize Webpay with environment variables
export class WebpayService {
    private static tx: typeof WebpayPlus.Transaction.prototype;

    static initialize() {
        const environment = process.env.WEBPAY_ENVIRONMENT === 'production'
            ? Environment.Production
            : Environment.Integration;

        const commerceCode = process.env.WEBPAY_ENVIRONMENT === 'production'
            ? process.env.WEBPAY_COMMERCE_CODE!
            : IntegrationCommerceCodes.WEBPAY_PLUS;

        const apiKey = process.env.WEBPAY_ENVIRONMENT === 'production'
            ? process.env.WEBPAY_API_KEY!
            : IntegrationApiKeys.WEBPAY;

        this.tx = new WebpayPlus.Transaction(
            new Options(commerceCode, apiKey, environment)
        );

        return this.tx;
    }

    /**
     * Create a new payment transaction
     * @param buyOrder - Unique order identifier (e.g., "APT-clxxxxxx")
     * @param sessionId - User session identifier
     * @param amount - Amount in CLP (Chilean pesos)
     * @param returnUrl - URL where user returns after payment
     */
    static async createTransaction(
        buyOrder: string,
        sessionId: string,
        amount: number,
        returnUrl: string
    ) {
        const tx = this.initialize();

        try {
            const request: CreateTransactionRequest = {
                buy_order: buyOrder,
                session_id: sessionId,
                amount: amount,
                return_url: returnUrl
            };

            const response = await tx.create(
                request.buy_order,
                request.session_id,
                request.amount,
                request.return_url
            ) as CreateTransactionResponse;

            return {
                success: true,
                token: response.token,
                url: response.url,
            };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Error creating payment';
            console.error('Error creating Webpay transaction:', error);
            return {
                success: false,
                error: errorMessage,
            };
        }
    }

    /**
     * Confirm a transaction after user completes payment
     * @param token - Token returned by Webpay
     */
    static async confirmTransaction(token: string) {
        const tx = this.initialize();

        try {
            const response = await tx.commit(token) as CommitTransactionResponse;

            return {
                success: response.response_code === 0,
                vci: response.vci,
                amount: response.amount,
                status: response.status,
                buyOrder: response.buy_order,
                sessionId: response.session_id,
                cardNumber: response.card_detail?.card_number,
                accountingDate: response.accounting_date,
                transactionDate: response.transaction_date,
                authorizationCode: response.authorization_code,
                paymentTypeCode: response.payment_type_code,
                responseCode: response.response_code,
                installmentsNumber: response.installments_number,
            };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Error confirming payment';
            console.error('Error confirming Webpay transaction:', error);
            return {
                success: false,
                error: errorMessage,
            };
        }
    }

    /**
     * Get status of a transaction
     * @param token - Token returned by Webpay
     */
    static async getTransactionStatus(token: string) {
        const tx = this.initialize();

        try {
            const response = await tx.status(token);
            return {
                success: true,
                status: response,
            };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Error getting payment status';
            console.error('Error getting Webpay transaction status:', error);
            return {
                success: false,
                error: errorMessage,
            };
        }
    }

    /**
     * Refund a transaction (only available for certain payment types)
     * @param token - Token of the transaction to refund
     * @param amount - Amount to refund in CLP
     */
    static async refundTransaction(token: string, amount: number) {
        const tx = this.initialize();

        try {
            const response = await tx.refund(token, amount) as RefundTransactionResponse;
            return {
                success: true,
                type: response.type,
                authorizationCode: response.authorization_code,
                authorizationDate: response.authorization_date,
                nullifiedAmount: response.nullified_amount,
                balance: response.balance,
                responseCode: response.response_code,
            };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Error processing refund';
            console.error('Error refunding Webpay transaction:', error);
            return {
                success: false,
                error: errorMessage,
            };
        }
    }
}