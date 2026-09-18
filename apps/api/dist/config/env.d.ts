export declare const env: {
    PORT: number;
    NODE_ENV: "development" | "test" | "production";
    DATABASE_URL: string;
    JWT_SECRET: string;
    JWT_EXPIRES_IN: string;
    CORS_ORIGIN: string;
    PUBLIC_APP_URL: string;
    SMTP_PORT: number;
    SMTP_HOST?: string | undefined;
    SMTP_USER?: string | undefined;
    SMTP_PASS?: string | undefined;
    SMTP_FROM?: string | undefined;
};
