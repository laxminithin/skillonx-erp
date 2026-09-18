export type GatewayOrderResult = {
    orderId: string;
    provider: string;
    amount: string;
    currency: string;
    paymentId: number;
};
export interface PaymentGatewayProvider {
    name: string;
    createOrder(params: {
        collegeId: number;
        studentId: number;
        amount: string;
        currency: string;
        metadata?: Record<string, unknown>;
    }): Promise<{
        providerOrderId: string;
        checkoutData?: unknown;
    }>;
    verifyPayment(params: {
        providerOrderId: string;
        paymentData: Record<string, unknown>;
    }): Promise<{
        verified: boolean;
        transactionReference?: string;
        gatewayReference?: string;
    }>;
    refund?(params: {
        providerOrderId: string;
        amount: string;
    }): Promise<{
        refundId: string;
    }>;
    getStatus?(providerOrderId: string): Promise<string>;
}
export declare function getGatewayProvider(name?: string | null): PaymentGatewayProvider;
export declare function registerGatewayProvider(provider: PaymentGatewayProvider): void;
export declare function initiateOnlinePayment(studentId: number, collegeId: number, body: {
    demandIds: number[];
    installmentIds?: number[];
    amount?: number;
}): Promise<{
    paymentId: number;
    paymentNumber: string;
    orderId: string;
    provider: string;
    amount: string;
    currency: any;
    checkoutData: unknown;
}>;
export declare function verifyAndCompletePayment(provider: string, eventId: string, orderId: string, paymentData: Record<string, unknown>): Promise<{
    duplicate: boolean;
    status: any;
    success?: undefined;
    receipt?: undefined;
} | {
    success: boolean;
    status: string;
    duplicate?: undefined;
    receipt?: undefined;
} | {
    success: boolean;
    receipt: {
        id: number;
        receiptNumber: string;
        studentId: number;
        paymentId: number;
        receiptDate: unknown;
        amount: string;
        paymentMethod: unknown;
        transactionReference: unknown;
        outstandingBalance: string;
        status: unknown;
        snapshot: unknown;
        voidedAt: unknown;
        voidReason: unknown;
    };
    duplicate?: undefined;
    status?: undefined;
}>;
