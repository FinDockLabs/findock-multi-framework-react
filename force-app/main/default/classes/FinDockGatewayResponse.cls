/**
 * Raw result of a FinDock Payment API call made on-platform: the HTTP-style status code and
 * the JSON body, exactly as the managed package would return them over REST.
 */
public class FinDockGatewayResponse {
    public Integer statusCode { get; private set; }
    public String body { get; private set; }

    public FinDockGatewayResponse(Integer statusCode, String body) {
        this.statusCode = statusCode;
        this.body = body;
    }

    public Boolean isSuccess() {
        return statusCode != null && statusCode >= 200 && statusCode < 300;
    }
}
