declare module 'react-native-razorpay' {
    export interface RazorpayCheckoutOptions {
        key: string;
        amount: number | string;
        currency: string;
        order_id: string;
        name: string;
        description?: string;
        image?: string;
        prefill?: {
            name?: string;
            email?: string;
            contact?: string;
        };
        theme?: {
            color?: string;
        };
    }

    export interface RazorpaySuccessResponse {
        razorpay_order_id: string;
        razorpay_payment_id: string;
        razorpay_signature: string;
    }

    export interface RazorpayErrorResponse {
        code?: string | number;
        description?: string;
        error?: {
            code?: string;
            description?: string;
            reason?: string;
        };
    }

    const RazorpayCheckout: {
        open(options: RazorpayCheckoutOptions): Promise<RazorpaySuccessResponse>;
    };

    export default RazorpayCheckout;
}
