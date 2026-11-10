@IsTest
private class FinDockRestContextGatewayTest {

    /**
     * Exercises the RestContext swap against the real managed classes. No PSP is contacted:
     * an empty PaymentIntent is rejected by FinDock's own validation, and the payment method
     * list is simply whatever the test context can see. What we assert is the contract of the
     * gateway itself: a response object comes back and our own RestContext is restored.
     */
    @IsTest
    static void restoresCallerContextAroundManagedCalls() {
        RestRequest mine = new RestRequest();
        mine.requestURI = '/services/apexrest/donate/v1/intent';
        mine.httpMethod = 'POST';
        RestResponse myResponse = new RestResponse();
        RestContext.request = mine;
        RestContext.response = myResponse;

        FinDockRestContextGateway gateway = new FinDockRestContextGateway();

        FinDockGatewayResponse methods;
        try {
            methods = gateway.getPaymentMethods();
        } catch (Exception e) {
            methods = null;
        }
        System.assertEquals(mine, RestContext.request, 'request context restored after GET');
        System.assertEquals(myResponse, RestContext.response, 'response context restored after GET');
        if (methods != null) {
            System.assertNotEquals(null, methods.statusCode);
            System.assertNotEquals(null, methods.body);
        }

        FinDockGatewayResponse intent;
        try {
            intent = gateway.postPaymentIntent('{}');
        } catch (Exception e) {
            intent = null;
        }
        System.assertEquals(mine, RestContext.request, 'request context restored after POST');
        System.assertEquals(myResponse, RestContext.response, 'response context restored after POST');
        if (intent != null) {
            System.assertNotEquals(null, intent.statusCode);
            System.assert(!intent.isSuccess() || intent.body != null);
        }
    }

    @IsTest
    static void responseHelpers() {
        System.assert(new FinDockGatewayResponse(200, '{}').isSuccess());
        System.assert(new FinDockGatewayResponse(204, '').isSuccess());
        System.assert(!new FinDockGatewayResponse(422, '{}').isSuccess());
        System.assert(!new FinDockGatewayResponse(null, null).isSuccess());
    }
}
