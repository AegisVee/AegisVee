// frontend/src/utils/telemetry.js

const IS_PROD = import.meta.env.PROD;

export const Telemetry = {
    logEvent: (eventName, data = {}) => {
        if (IS_PROD) {
            // Placeholder: Sentry.captureMessage(eventName, data);
            console.log(`[Telemetry-PROD] ${eventName}`, data);
        } else {
            console.log(`[Telemetry-DEV] ${eventName}`, data);
        }
    },

    logError: (error, context = {}) => {
        if (IS_PROD) {
            // Placeholder: Sentry.captureException(error, { extra: context });
            console.error(`[Telemetry-PROD] Error:`, error, context);
        } else {
            console.error(`[Telemetry-DEV] Error:`, error, context);
        }
    }
};

export default Telemetry;
