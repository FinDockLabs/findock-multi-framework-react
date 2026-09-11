/**
 * Calls the FinDock Payment API on-platform, in the same transaction, with no HTTP callout,
 * Bearer token, or CORS.
 *
 * FinDock: cpm.API_PaymentIntent_V2 and cpm.API_PaymentMethod_V2 are @RestResource classes whose
 * entry points read RestContext.request and write RestContext.response. We are ourselves running
 * inside an Apex REST request, so we temporarily swap in a fresh request/response pair, invoke the
 * managed method, capture its output, and restore the original context before returning.
 * Pattern verified against the FinDockLabs findock-experience-cloud-examples repository.
 */
public with sharing class FinDockRestContextGateway implements FinDockGateway {

    private static final String PAYMENT_INTENT_URI = '/services/apexrest/cpm/v2/PaymentIntent';
    private static final String PAYMENT_METHODS_URI = '/services/apexrest/cpm/v2/PaymentMethods';

    public FinDockGatewayResponse postPaymentIntent(String requestBody) {
        RestRequest req = new RestRequest();
        req.requestURI = URL.getOrgDomainUrl().toExternalForm() + PAYMENT_INTENT_URI;
        req.httpMethod = 'POST';
        req.addHeader('Content-Type', 'application/json');
        req.requestBody = Blob.valueOf(requestBody);
        return invoke(req, true);
    }

    public FinDockGatewayResponse getPaymentMethods() {
        RestRequest req = new RestRequest();
        req.requestURI = URL.getOrgDomainUrl().toExternalForm() + PAYMENT_METHODS_URI;
        req.httpMethod = 'GET';
        return invoke(req, false);
    }

    private FinDockGatewayResponse invoke(RestRequest req, Boolean isPost) {
        RestRequest originalRequest = RestContext.request;
        RestResponse originalResponse = RestContext.response;
        RestResponse res = new RestResponse();
        try {
            RestContext.request = req;
            RestContext.response = res;
            if (isPost) {
                // FinDock: create the payment intent in-transaction
                cpm.API_PaymentIntent_V2.postPaymentIntent();
            } else {
                // FinDock: list the org's active payment methods and processors
                cpm.API_PaymentMethod_V2.getPaymentMethods();
            }
        } finally {
            RestContext.request = originalRequest;
            RestContext.response = originalResponse;
        }
        Integer status = res.statusCode == null ? 200 : res.statusCode;
        String body = res.responseBody == null ? '' : res.responseBody.toString();
        return new FinDockGatewayResponse(status, body);
    }
}
