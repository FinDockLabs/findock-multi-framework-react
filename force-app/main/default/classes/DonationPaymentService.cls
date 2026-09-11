/**
 * Donation policy + FinDock PaymentIntent assembly for the public React donation page.
 *
 * The browser is never trusted: amounts, frequency, payment method, method parameters,
 * payer shape and return URLs are all validated here against Donation_Page_Setting__mdt and
 * the live FinDock /PaymentMethods response before anything reaches FinDock.
 */
public with sharing class DonationPaymentService {

    public static final String FREQUENCY_ONE_TIME = 'oneTime';
    public static final String FREQUENCY_MONTHLY = 'monthly';

    /** FinDock: error codes 201-205 are the only payer-recoverable ones (bad IBAN/BIC/address). */
    private static final Set<String> RECOVERABLE_ERROR_CODES = new Set<String>{ '201', '202', '203', '204', '205' };

    private static final Pattern EMAIL_PATTERN = Pattern.compile('^[^\\s@]+@[^\\s@]+\\.[^\\s@]{2,}$');
    private static final Pattern SF_ID_PATTERN = Pattern.compile('^[a-zA-Z0-9]{15}([a-zA-Z0-9]{3})?$');

    @TestVisible
    private static FinDockGateway gateway = new FinDockRestContextGateway();

    // ---------------------------------------------------------------- DTOs

    public class ValidationException extends Exception {
        public String field;
        public ValidationException(String field, String message) {
            this(message);
            this.field = field;
        }
    }

    public class ParameterOption {
        public String value;
        public String label;
        public String imageUrl;
    }

    public class ParameterView {
        public String name;
        public String label;
        public String description;
        public String dataType;
        public Boolean required;
        public Integer minLength;
        public Integer maxLength;
        public List<ParameterOption> options;
    }

    public class PaymentMethodView {
        public String name;
        public String label;
        public String processor;
        public String imageUrl;
        public Boolean supportsRecurring;
        public String initialPaymentOnRecurring;
        public List<ParameterView> parameters = new List<ParameterView>();
    }

    public class ConfigResponse {
        public String organisationName;
        public String currencyCode;
        public Decimal minAmount;
        public Decimal maxAmount;
        public String supportEmail;
        public List<DonationSettings.Preset> oneTimePresets;
        public List<DonationSettings.Preset> recurringPresets;
        public List<PaymentMethodView> oneTimeMethods = new List<PaymentMethodView>();
        public List<PaymentMethodView> recurringMethods = new List<PaymentMethodView>();
    }

    public class IntentRequest {
        public String frequency;
        public Decimal amount;
        public String paymentMethod;
        public Map<String, String> parameters;
        public String firstName;
        public String lastName;
        public String email;
        public String campaignId;
        public String successUrl;
        public String failureUrl;
    }

    public class ApiError {
        public String code;
        public String message;
        public String field;
        public ApiError(String code, String message, String field) {
            this.code = code;
            this.message = message;
            this.field = field;
        }
    }

    /** status: redirect | success | recoverable | invalid | failed */
    public class IntentResponse {
        public String status;
        public String redirectUrl;
        public String paymentIntentId;
        public List<ApiError> errors = new List<ApiError>();
    }

    // ---------------------------------------------------------------- Config

    public static ConfigResponse getConfig() {
        DonationSettings settings = DonationSettings.load();
        ConfigResponse cfg = new ConfigResponse();
        cfg.organisationName = settings.organisationName;
        cfg.currencyCode = settings.currencyCode;
        cfg.minAmount = settings.minAmount;
        cfg.maxAmount = settings.maxAmount;
        cfg.supportEmail = settings.supportEmail;
        cfg.oneTimePresets = settings.oneTimePresets;
        cfg.recurringPresets = settings.recurringPresets;

        Map<String, PaymentMethodView> available = loadAvailableMethods(settings);
        for (String name : settings.oneTimeMethods) {
            PaymentMethodView m = available.get(name.toLowerCase());
            if (m != null) {
                cfg.oneTimeMethods.add(m);
            }
        }
        for (String name : settings.recurringMethods) {
            PaymentMethodView m = available.get(name.toLowerCase());
            if (m != null && m.supportsRecurring == true) {
                cfg.recurringMethods.add(m);
            }
        }
        return cfg;
    }

    /**
     * FinDock: GET /PaymentMethods returns every activated method with its processors, each
     * carrying IsDefault, SupportsRecurring, InitialPaymentOnRecurring, Parameters (with Enum
     * options that include label + image.svg) and the method logo (image.svg on the processor).
     */
    @TestVisible
    private static Map<String, PaymentMethodView> loadAvailableMethods(DonationSettings settings) {
        Map<String, PaymentMethodView> byName = new Map<String, PaymentMethodView>();
        FinDockGatewayResponse res = gateway.getPaymentMethods();
        if (!res.isSuccess() || String.isBlank(res.body)) {
            System.debug(LoggingLevel.ERROR, 'FinDock /PaymentMethods failed: ' + res.statusCode + ' ' + res.body);
            return byName;
        }
        Object parsed = JSON.deserializeUntyped(res.body);
        List<Object> methods = extractMethodList(parsed);
        for (Object mObj : methods) {
            Map<String, Object> m = (Map<String, Object>) mObj;
            String name = (String) m.get('Name');
            if (String.isBlank(name)) {
                continue;
            }
            Map<String, Object> processor = pickProcessor((List<Object>) m.get('Processors'), settings.processor);
            if (processor == null) {
                continue;
            }
            PaymentMethodView view = new PaymentMethodView();
            view.name = name;
            view.label = displayLabel(name);
            view.processor = (String) processor.get('Name');
            view.imageUrl = readSvg(processor.get('image'));
            view.supportsRecurring = processor.get('SupportsRecurring') == true;
            view.initialPaymentOnRecurring = (String) processor.get('InitialPaymentOnRecurring');
            if (view.initialPaymentOnRecurring == null && processor.get('RecurringRequiresInitialPayment') == true) {
                view.initialPaymentOnRecurring = 'required';
            }
            Object params = processor.get('Parameters');
            if (params instanceof List<Object>) {
                for (Object pObj : (List<Object>) params) {
                    view.parameters.add(toParameterView((Map<String, Object>) pObj));
                }
            }
            byName.put(name.toLowerCase(), view);
        }
        return byName;
    }

    private static List<Object> extractMethodList(Object parsed) {
        if (parsed instanceof List<Object>) {
            return (List<Object>) parsed;
        }
        if (parsed instanceof Map<String, Object>) {
            Object innerList = ((Map<String, Object>) parsed).get('PaymentMethods');
            if (innerList instanceof List<Object>) {
                return (List<Object>) innerList;
            }
        }
        return new List<Object>();
    }

    /** Preferred processor from settings if the method supports it, else FinDock's default, else the first. */
    private static Map<String, Object> pickProcessor(List<Object> processors, String preferred) {
        if (processors == null || processors.isEmpty()) {
            return null;
        }
        Map<String, Object> firstProcessor;
        Map<String, Object> defaultProcessor;
        for (Object pObj : processors) {
            Map<String, Object> p = (Map<String, Object>) pObj;
            if (firstProcessor == null) {
                firstProcessor = p;
            }
            if (preferred != null && preferred.equalsIgnoreCase((String) p.get('Name'))) {
                return p;
            }
            if (defaultProcessor == null && p.get('IsDefault') == true) {
                defaultProcessor = p;
            }
        }
        return defaultProcessor != null ? defaultProcessor : firstProcessor;
    }

    private static ParameterView toParameterView(Map<String, Object> p) {
        ParameterView v = new ParameterView();
        v.name = (String) p.get('Name');
        v.label = displayLabel(v.name);
        v.description = (String) p.get('Description');
        v.dataType = (String) p.get('DataType');
        v.required = p.get('Required') == true;
        v.minLength = toInteger(p.get('minLength'));
        v.maxLength = toInteger(p.get('maxLength'));
        Object enumValues = p.get('Enum');
        if (enumValues instanceof List<Object>) {
            v.options = new List<ParameterOption>();
            for (Object oObj : (List<Object>) enumValues) {
                ParameterOption opt = new ParameterOption();
                if (oObj instanceof Map<String, Object>) {
                    Map<String, Object> o = (Map<String, Object>) oObj;
                    opt.value = String.valueOf(o.get('value'));
                    opt.label = o.containsKey('label') ? String.valueOf(o.get('label')) : opt.value;
                    opt.imageUrl = readSvg(o.get('image'));
                } else {
                    opt.value = String.valueOf(oObj);
                    opt.label = opt.value;
                }
                v.options.add(opt);
            }
        }
        return v;
    }

    private static String readSvg(Object image) {
        if (image instanceof Map<String, Object>) {
            Object svg = ((Map<String, Object>) image).get('svg');
            return svg == null ? null : String.valueOf(svg);
        }
        return image == null ? null : String.valueOf(image);
    }

    private static Integer toInteger(Object value) {
        if (value == null) {
            return null;
        }
        if (value instanceof Integer) {
            return (Integer) value;
        }
        if (value instanceof Decimal) {
            return ((Decimal) value).intValue();
        }
        try {
            return Integer.valueOf(String.valueOf(value));
        } catch (Exception e) {
            return null;
        }
    }

    /** "SEPA Direct Debit" -> "SEPA Direct Debit", "CreditCard" -> "Credit Card", "Ideal" -> "iDEAL". */
    @TestVisible
    private static String displayLabel(String apiName) {
        if (String.isBlank(apiName)) {
            return apiName;
        }
        Map<String, String> known = new Map<String, String>{
            'ideal' => 'iDEAL', 'creditcard' => 'Credit or debit card', 'paypal' => 'PayPal',
            'applepay' => 'Apple Pay', 'googlepay' => 'Google Pay', 'issuer' => 'Your bank',
            'iban' => 'IBAN', 'holdername' => 'Account holder name', 'cardbrand' => 'Card brand',
            'bic' => 'BIC', 'accountnumber' => 'Account number', 'routingnumber' => 'Routing number'
        };
        String key = apiName.replaceAll('[^a-zA-Z0-9]', '').toLowerCase();
        if (known.containsKey(key)) {
            return known.get(key);
        }
        return apiName.replaceAll('([a-z])([A-Z])', '$1 $2');
    }

    // ---------------------------------------------------------------- Intent

    public static IntentResponse createIntent(IntentRequest req, String requestHost) {
        DonationSettings settings = DonationSettings.load();
        IntentResponse out = new IntentResponse();
        try {
            validateRequest(req, settings, requestHost);
            Map<String, PaymentMethodView> available = loadAvailableMethods(settings);
            PaymentMethodView method = resolveMethod(req, settings, available);
            Map<String, Object> parameters = validateParameters(req.parameters, method);
            Map<String, Object> intent = buildIntent(req, settings, method, parameters);

            // FinDock: submit the PaymentIntent in-transaction; response mirrors POST /PaymentIntent
            FinDockGatewayResponse res = gateway.postPaymentIntent(JSON.serialize(intent, true));
            return interpret(res);
        } catch (ValidationException e) {
            out.status = 'invalid';
            out.errors.add(new ApiError('invalid', e.getMessage(), e.field));
            return out;
        } catch (Exception e) {
            System.debug(LoggingLevel.ERROR, 'Donation intent failed: ' + e.getTypeName() + ' ' + e.getMessage() + '\n' + e.getStackTraceString());
            out.status = 'failed';
            out.errors.add(new ApiError('999', 'The donation could not be started.', null));
            return out;
        }
    }

    @TestVisible
    private static void validateRequest(IntentRequest req, DonationSettings settings, String requestHost) {
        if (req == null) {
            throw new ValidationException(null, 'Missing request body.');
        }
        if (req.frequency != FREQUENCY_ONE_TIME && req.frequency != FREQUENCY_MONTHLY) {
            throw new ValidationException('frequency', 'Choose a one-time or monthly gift.');
        }
        if (req.amount == null || req.amount <= 0) {
            throw new ValidationException('amount', 'Enter a donation amount.');
        }
        if (req.amount.scale() > 2) {
            throw new ValidationException('amount', 'Use at most two decimals.');
        }
        if (req.amount < settings.minAmount) {
            throw new ValidationException('amount', 'The minimum donation is ' + formatAmount(settings.minAmount, settings.currencyCode) + '.');
        }
        if (req.amount > settings.maxAmount) {
            throw new ValidationException('amount', 'The maximum online donation is ' + formatAmount(settings.maxAmount, settings.currencyCode) + '. Please contact us for larger gifts.');
        }
        if (String.isBlank(req.lastName) || req.lastName.trim().length() > 80) {
            throw new ValidationException('lastName', 'Enter your last name.');
        }
        if (String.isNotBlank(req.firstName) && req.firstName.trim().length() > 40) {
            throw new ValidationException('firstName', 'First name is too long.');
        }
        if (String.isBlank(req.email) || req.email.trim().length() > 80 || !EMAIL_PATTERN.matcher(req.email.trim()).matches()) {
            throw new ValidationException('email', 'Enter a valid email address so we can send your receipt.');
        }
        if (String.isBlank(req.paymentMethod)) {
            throw new ValidationException('paymentMethod', 'Choose a payment method.');
        }
        validateReturnUrl(req.successUrl, 'successUrl', settings, requestHost);
        validateReturnUrl(req.failureUrl, 'failureUrl', settings, requestHost);
        if (String.isNotBlank(req.campaignId) && !SF_ID_PATTERN.matcher(req.campaignId).matches()) {
            throw new ValidationException('campaignId', 'Invalid campaign reference.');
        }
    }

    /**
     * Return URLs are supplied by the page (so the Experience site path prefix is preserved),
     * but only same-site destinations are accepted so this endpoint cannot be abused as an
     * open redirect. Allowed: the host this request arrived on, the org domain, and any hosts
     * configured in Allowed_Return_Hosts__c.
     */
    @TestVisible
    private static void validateReturnUrl(String value, String field, DonationSettings settings, String requestHost) {
        if (String.isBlank(value)) {
            throw new ValidationException(field, 'Missing return URL.');
        }
        Url parsed;
        try {
            parsed = new Url(value);
        } catch (Exception e) {
            throw new ValidationException(field, 'Invalid return URL.');
        }
        if (parsed.getProtocol() != 'https' || String.isBlank(parsed.getHost())) {
            throw new ValidationException(field, 'Return URL must use https.');
        }
        String host = parsed.getHost().toLowerCase();
        Set<String> allowed = new Set<String>(settings.allowedReturnHosts);
        if (String.isNotBlank(requestHost)) {
            allowed.add(requestHost.toLowerCase().substringBefore(':'));
        }
        allowed.add(URL.getOrgDomainUrl().getHost().toLowerCase());
        Boolean ok = allowed.contains(host)
            || host.endsWith('.my.site.com')
            || host.endsWith('.force.com')
            || host.endsWith('.salesforce.com');
        if (!ok) {
            throw new ValidationException(field, 'Return URL must point to this site.');
        }
    }

    private static PaymentMethodView resolveMethod(IntentRequest req, DonationSettings settings, Map<String, PaymentMethodView> available) {
        List<String> allowedNames = req.frequency == FREQUENCY_MONTHLY ? settings.recurringMethods : settings.oneTimeMethods;
        for (String name : allowedNames) {
            if (name.equalsIgnoreCase(req.paymentMethod.trim())) {
                PaymentMethodView view = available.get(name.toLowerCase());
                if (view == null) {
                    throw new ValidationException('paymentMethod', 'This payment method is currently unavailable.');
                }
                if (req.frequency == FREQUENCY_MONTHLY && view.supportsRecurring != true) {
                    throw new ValidationException('paymentMethod', 'This payment method does not support monthly gifts.');
                }
                return view;
            }
        }
        throw new ValidationException('paymentMethod', 'Choose one of the offered payment methods.');
    }

    /** Only parameters FinDock declares for this method/processor are forwarded; enums must match an option. */
    @TestVisible
    private static Map<String, Object> validateParameters(Map<String, String> supplied, PaymentMethodView method) {
        Map<String, Object> clean = new Map<String, Object>();
        Map<String, String> input = supplied == null ? new Map<String, String>() : supplied;
        for (ParameterView p : method.parameters) {
            String raw = input.get(p.name);
            String value = raw == null ? null : String.valueOf(raw).trim();
            if (String.isBlank(value)) {
                if (p.required == true) {
                    throw new ValidationException('parameters.' + p.name, p.label + ' is required.');
                }
                continue;
            }
            if (value.length() > 255) {
                throw new ValidationException('parameters.' + p.name, p.label + ' is too long.');
            }
            if (p.minLength != null && value.length() < p.minLength) {
                throw new ValidationException('parameters.' + p.name, p.label + ' must be at least ' + p.minLength + ' characters.');
            }
            if (p.maxLength != null && value.length() > p.maxLength) {
                throw new ValidationException('parameters.' + p.name, p.label + ' must be at most ' + p.maxLength + ' characters.');
            }
            if (p.options != null && !p.options.isEmpty()) {
                Boolean found = false;
                for (ParameterOption o : p.options) {
                    if (o.value == value) {
                        found = true;
                        break;
                    }
                }
                if (!found) {
                    throw new ValidationException('parameters.' + p.name, 'Choose one of the listed options for ' + p.label + '.');
                }
            }
            if (p.dataType == 'Integer') {
                try {
                    clean.put(p.name, Integer.valueOf(value));
                } catch (Exception e) {
                    throw new ValidationException('parameters.' + p.name, p.label + ' must be a whole number.');
                }
            } else {
                clean.put(p.name, value);
            }
        }
        return clean;
    }

    /** FinDock: assemble the PaymentIntent exactly as documented for POST /PaymentIntent. */
    @TestVisible
    private static Map<String, Object> buildIntent(IntentRequest req, DonationSettings settings, PaymentMethodView method, Map<String, Object> parameters) {
        Map<String, Object> intent = new Map<String, Object>();
        intent.put('SuccessURL', req.successUrl.trim());
        intent.put('FailureURL', req.failureUrl.trim());
        intent.put('Origin', settings.origin);

        String campaignId = resolveCampaign(req.campaignId, settings.defaultCampaignId);
        if (campaignId != null) {
            intent.put('CampaignId', campaignId);
        }

        // FinDock: Fundraising (NPC) payers are Person Accounts -> Account block with RecordTypeName.
        // Standard Contact fields on a Person Account are prefixed with "Person" (PersonEmail).
        Map<String, Object> payerFields = new Map<String, Object>{
            'LastName' => req.lastName.trim()
        };
        if (String.isNotBlank(req.firstName)) {
            payerFields.put('FirstName', req.firstName.trim());
        }
        if (settings.payerRecordType != null) {
            payerFields.put('PersonEmail', req.email.trim());
            intent.put('Payer', new Map<String, Object>{
                'Account' => new Map<String, Object>{
                    'RecordTypeName' => settings.payerRecordType,
                    'SalesforceFields' => payerFields
                }
            });
        } else {
            payerFields.put('Email', req.email.trim());
            intent.put('Payer', new Map<String, Object>{
                'Contact' => new Map<String, Object>{ 'SalesforceFields' => payerFields }
            });
        }

        if (req.frequency == FREQUENCY_MONTHLY) {
            // FinDock: Recurring requires Amount, Frequency and StartDate. With FinDock for
            // Fundraising the Frequency maps to the Gift Commitment Schedule transaction period.
            Boolean initialRequired = method.initialPaymentOnRecurring == 'required';
            Date startDate = initialRequired ? Date.today().addMonths(1) : Date.today();
            intent.put('Recurring', new Map<String, Object>{
                'Amount' => req.amount,
                'CurrencyISOCode' => settings.currencyCode,
                'Frequency' => 'Monthly',
                'StartDate' => String.valueOf(startDate)
            });
            if (initialRequired) {
                // FinDock: some processors authorise the mandate with a first charge now; the
                // schedule then starts one month later so the donor is not charged twice.
                intent.put('OneTime', new Map<String, Object>{
                    'Amount' => req.amount,
                    'CurrencyISOCode' => settings.currencyCode
                });
            }
        } else {
            intent.put('OneTime', new Map<String, Object>{
                'Amount' => req.amount,
                'CurrencyISOCode' => settings.currencyCode
            });
        }

        // FinDock: hosted checkout pages (Stripe) accept a merchant-side item name / description.
        // Fill them from settings so the PSP page reads "Gift to <org>" instead of a blank line.
        String giftLabel = (req.frequency == FREQUENCY_MONTHLY ? 'Monthly gift to ' : 'Gift to ') + settings.organisationName;
        for (ParameterView p : method.parameters) {
            if ((p.name == 'itemName' || p.name == 'description') && !parameters.containsKey(p.name)) {
                parameters.put(p.name, giftLabel.abbreviate(120));
            }
        }

        Map<String, Object> pm = new Map<String, Object>{
            'Name' => method.name,
            // FinDock: processor resolved server-side from /PaymentMethods (settings override,
            // else the org default) so the donor always pays through the processor shown.
            'Processor' => method.processor
        };
        if (!parameters.isEmpty()) {
            pm.put('Parameters', parameters);
        }
        intent.put('PaymentMethod', pm);

        if (settings.sourceConnector != null) {
            intent.put('Settings', new Map<String, Object>{ 'SourceConnector' => settings.sourceConnector });
        }
        return intent;
    }

    /** A campaign from the URL is only honoured when it exists and is active; otherwise the default applies. */
    private static String resolveCampaign(String requested, String fallback) {
        if (String.isNotBlank(requested) && SF_ID_PATTERN.matcher(requested).matches()) {
            if (new CampaignLookup().isActive(requested)) {
                return requested;
            }
        }
        return fallback;
    }

    /** FinDock: normalise the response into what the page needs to route the donor. */
    @TestVisible
    private static IntentResponse interpret(FinDockGatewayResponse res) {
        IntentResponse out = new IntentResponse();
        Map<String, Object> body = new Map<String, Object>();
        if (String.isNotBlank(res.body)) {
            try {
                Object parsed = JSON.deserializeUntyped(res.body);
                if (parsed instanceof Map<String, Object>) {
                    body = (Map<String, Object>) parsed;
                }
            } catch (Exception e) {
                System.debug(LoggingLevel.ERROR, 'Unparseable FinDock response: ' + res.body);
            }
        }
        if (res.isSuccess()) {
            out.paymentIntentId = body.get('Id') == null ? null : String.valueOf(body.get('Id'));
            String redirect = body.get('RedirectURL') == null ? null : String.valueOf(body.get('RedirectURL'));
            if (String.isNotBlank(redirect)) {
                out.status = 'redirect';
                out.redirectUrl = redirect;
            } else {
                out.status = 'success';
            }
            return out;
        }

        System.debug(LoggingLevel.ERROR, 'FinDock PaymentIntent error ' + res.statusCode + ': ' + res.body);
        List<ApiError> errors = new List<ApiError>();
        Boolean allRecoverable = true;
        Object rawErrors = body.get('Errors');
        if (rawErrors instanceof List<Object>) {
            for (Object eObj : (List<Object>) rawErrors) {
                Map<String, Object> e = (Map<String, Object>) eObj;
                String code = String.valueOf(e.get('error_code'));
                String message = String.valueOf(e.get('error_message'));
                if (!RECOVERABLE_ERROR_CODES.contains(code)) {
                    allRecoverable = false;
                }
                errors.add(new ApiError(code, message, fieldForErrorCode(code)));
            }
        } else if (body.containsKey('error_code')) {
            String code = String.valueOf(body.get('error_code'));
            allRecoverable = RECOVERABLE_ERROR_CODES.contains(code);
            errors.add(new ApiError(code, String.valueOf(body.get('error_message')), fieldForErrorCode(code)));
        } else {
            allRecoverable = false;
        }

        if (!errors.isEmpty() && allRecoverable) {
            out.status = 'recoverable';
            out.errors = errors;
        } else {
            // Non-recoverable: never surface raw FinDock text or codes to the donor.
            out.status = 'failed';
            out.errors.add(new ApiError('999', 'The donation could not be started.', null));
        }
        return out;
    }

    private static String fieldForErrorCode(String code) {
        if (code == '201') return 'parameters.accountNumber';
        if (code == '202' || code == '203') return 'parameters.iban';
        if (code == '204') return 'parameters.bic';
        return null;
    }

    private static String formatAmount(Decimal amount, String currencyCode) {
        return currencyCode + ' ' + amount.setScale(amount.scale() > 0 ? 2 : 0).toPlainString();
    }

    /** Campaign existence check runs without sharing: the guest user has no Campaign access. */
    private without sharing class CampaignLookup {
        public Boolean isActive(String campaignId) {
            try {
                List<Campaign> found = [SELECT Id FROM Campaign WHERE Id = :campaignId AND IsActive = true LIMIT 1];
                return !found.isEmpty();
            } catch (Exception e) {
                return false;
            }
        }
    }
}
