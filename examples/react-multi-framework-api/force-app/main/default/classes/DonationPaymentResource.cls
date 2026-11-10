/**
 * Public HTTP surface for the React donation page, called through the Salesforce UI Bundle
 * SDK (platform fetch) from the Experience Cloud site.
 *
 *   GET  /services/apexrest/donate/v1/config  -> settings + offered payment methods
 *   POST /services/apexrest/donate/v1/intent  -> create a FinDock PaymentIntent
 *
 * The site guest user only needs execute access to this class and its collaborators
 * (Donation_Public_Access permission set) plus FinDock's Experience Cloud permission set.
 * All Payment / Installment / Gift Commitment writes are performed asynchronously by the
 * FinDock ProcessingHub integration user, so the guest never needs object CRUD.
 */
@RestResource(urlMapping='/donate/v1/*')
global with sharing class DonationPaymentResource {

    @HttpGet
    global static void doGet() {
        RestRequest req = RestContext.request;
        if (!pathEndsWith(req, '/config')) {
            respond(404, new Map<String, Object>{ 'error' => 'Not found' });
            return;
        }
        DonationPaymentService.ConfigResponse cfg = DonationPaymentService.getConfig();
        respond(200, cfg);
    }

    @HttpPost
    global static void doPost() {
        RestRequest req = RestContext.request;
        if (!pathEndsWith(req, '/intent')) {
            respond(404, new Map<String, Object>{ 'error' => 'Not found' });
            return;
        }
        DonationPaymentService.IntentRequest body;
        try {
            String raw = req.requestBody == null ? '' : req.requestBody.toString();
            body = (DonationPaymentService.IntentRequest) JSON.deserialize(raw, DonationPaymentService.IntentRequest.class);
        } catch (Exception e) {
            DonationPaymentService.IntentResponse invalid = new DonationPaymentService.IntentResponse();
            invalid.status = 'invalid';
            invalid.errors.add(new DonationPaymentService.ApiError('invalid', 'Malformed request.', null));
            respond(400, invalid);
            return;
        }
        String host = req.headers == null ? null : req.headers.get('Host');
        DonationPaymentService.IntentResponse result = DonationPaymentService.createIntent(body, host);
        Integer status = result.status == 'invalid' ? 400 : (result.status == 'failed' ? 502 : 200);
        respond(status, result);
    }

    private static Boolean pathEndsWith(RestRequest req, String suffix) {
        if (req == null || String.isBlank(req.requestURI)) {
            return false;
        }
        String path = req.requestURI.removeEnd('/').toLowerCase();
        return path.endsWith(suffix);
    }

    private static void respond(Integer statusCode, Object payload) {
        RestResponse res = RestContext.response;
        if (res == null) {
            res = new RestResponse();
            RestContext.response = res;
        }
        res.statusCode = statusCode;
        res.addHeader('Content-Type', 'application/json; charset=utf-8');
        res.addHeader('Cache-Control', 'no-store');
        res.responseBody = Blob.valueOf(JSON.serialize(payload, true));
    }
}
