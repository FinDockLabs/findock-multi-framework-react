@IsTest
public class FinDockGatewayStub implements FinDockGateway {
    /** Records the last PaymentIntent body and returns canned FinDock responses. */
    public String lastIntentBody;
    public Integer intentStatus = 200;
    public String intentBody = '{"Id":"pi_test123","RedirectURL":"https://redirect.test.findock.com/checkout/abc"}';
    public Integer methodsStatus = 200;
    public String methodsBody = '{"PaymentMethods":[]}';

    public FinDockGatewayResponse postPaymentIntent(String requestBody) {
        lastIntentBody = requestBody;
        return new FinDockGatewayResponse(intentStatus, intentBody);
    }
    public FinDockGatewayResponse getPaymentMethods() {
        return new FinDockGatewayResponse(methodsStatus, methodsBody);
    }
}
