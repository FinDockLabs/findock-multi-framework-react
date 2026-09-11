/**
 * Seam between the donation service and the FinDock managed package.
 * The production implementation (FinDockRestContextGateway) calls FinDock in-transaction;
 * tests swap in a stub so no PSP is ever contacted.
 */
public interface FinDockGateway {
    /** FinDock: equivalent of POST /PaymentIntent. */
    FinDockGatewayResponse postPaymentIntent(String requestBody);
    /** FinDock: equivalent of GET /PaymentMethods. */
    FinDockGatewayResponse getPaymentMethods();
}
