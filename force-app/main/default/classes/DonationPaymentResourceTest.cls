@IsTest
private class DonationPaymentResourceTest {

    private static FinDockGatewayStub setup(String method, String path, String body) {
        FinDockGatewayStub stub = new FinDockGatewayStub();
        stub.methodsBody = DonationPaymentServiceTest.METHODS_JSON;
        DonationPaymentService.gateway = stub;
        DonationSettings.overrideRecord = new Donation_Page_Setting__mdt(
            DeveloperName = 'Default',
            Organisation_Name__c = 'Resource Test',
            One_Time_Methods__c = 'Ideal',
            Recurring_Methods__c = 'SEPA Direct Debit',
            Min_Amount__c = 1,
            Max_Amount__c = 500
        );
        RestRequest req = new RestRequest();
        req.requestURI = '/services/apexrest/donate/v1' + path;
        req.httpMethod = method;
        req.addHeader('Host', 'charity.my.site.com');
        if (body != null) {
            req.requestBody = Blob.valueOf(body);
        }
        RestContext.request = req;
        RestContext.response = new RestResponse();
        return stub;
    }

    private static Map<String, Object> responseBody() {
        return (Map<String, Object>) JSON.deserializeUntyped(RestContext.response.responseBody.toString());
    }

    @IsTest
    static void getConfigReturnsOfferedMethods() {
        setup('GET', '/config', null);
        DonationPaymentResource.doGet();
        System.assertEquals(200, RestContext.response.statusCode);
        Map<String, Object> body = responseBody();
        System.assertEquals('Resource Test', body.get('organisationName'));
        System.assertEquals(1, ((List<Object>) body.get('oneTimeMethods')).size());
        System.assertEquals(1, ((List<Object>) body.get('recurringMethods')).size());
    }

    @IsTest
    static void unknownPathsReturn404() {
        setup('GET', '/nope', null);
        DonationPaymentResource.doGet();
        System.assertEquals(404, RestContext.response.statusCode);

        setup('POST', '/config', '{}');
        DonationPaymentResource.doPost();
        System.assertEquals(404, RestContext.response.statusCode);
    }

    @IsTest
    static void postIntentRedirects() {
        FinDockGatewayStub stub = setup('POST', '/intent', JSON.serialize(new Map<String, Object>{
            'frequency' => 'oneTime', 'amount' => 20, 'paymentMethod' => 'Ideal',
            'parameters' => new Map<String, Object>{ 'issuer' => 'abnamro' },
            'firstName' => 'Grace', 'lastName' => 'Hopper', 'email' => 'grace@example.org',
            'successUrl' => 'https://charity.my.site.com/donate/thank-you',
            'failureUrl' => 'https://charity.my.site.com/donate/failed'
        }));
        DonationPaymentResource.doPost();
        System.assertEquals(200, RestContext.response.statusCode, RestContext.response.responseBody.toString());
        Map<String, Object> body = responseBody();
        System.assertEquals('redirect', body.get('status'));
        System.assert(String.valueOf(body.get('redirectUrl')).startsWith('https://redirect.test.findock.com'));
        System.assert(stub.lastIntentBody.contains('"issuer" : "abnamro"') || stub.lastIntentBody.contains('"issuer":"abnamro"'));
        // RestContext must be restored to our own request after the FinDock call
        System.assertEquals('/services/apexrest/donate/v1/intent', RestContext.request.requestURI);
    }

    @IsTest
    static void postIntentValidationIs400() {
        setup('POST', '/intent', '{"frequency":"oneTime","amount":0,"paymentMethod":"Ideal","lastName":"X","email":"x@example.org","successUrl":"https://charity.my.site.com/a","failureUrl":"https://charity.my.site.com/b"}');
        DonationPaymentResource.doPost();
        System.assertEquals(400, RestContext.response.statusCode);
        System.assertEquals('invalid', responseBody().get('status'));
    }

    @IsTest
    static void malformedJsonIs400() {
        setup('POST', '/intent', '{not json');
        DonationPaymentResource.doPost();
        System.assertEquals(400, RestContext.response.statusCode);
    }

    @IsTest
    static void finDockFailureIs502WithGenericError() {
        FinDockGatewayStub stub = setup('POST', '/intent', '{"frequency":"oneTime","amount":20,"paymentMethod":"Ideal","lastName":"X","email":"x@example.org","successUrl":"https://charity.my.site.com/a","failureUrl":"https://charity.my.site.com/b"}');
        stub.intentStatus = 422;
        stub.intentBody = '{"Errors":[{"error_code":"999","error_message":"internal"}]}';
        DonationPaymentResource.doPost();
        System.assertEquals(502, RestContext.response.statusCode);
        Map<String, Object> body = responseBody();
        System.assertEquals('failed', body.get('status'));
        System.assert(!RestContext.response.responseBody.toString().contains('internal'));
    }
}
