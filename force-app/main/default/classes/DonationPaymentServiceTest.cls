@IsTest
public class DonationPaymentServiceTest {

    public static final String METHODS_JSON = '{"PaymentMethods":[' +
        '{"Name":"CreditCard","Processors":[' +
            '{"Name":"PaymentHub-Adyen","IsDefault":true,"SupportsRecurring":true,"InitialPaymentOnRecurring":"optional","Parameters":[],"image":{"svg":"https://external.findock.com/icon/payment-methods/creditcard.svg"}},' +
            '{"Name":"PaymentHub-Stripe","IsDefault":false,"SupportsRecurring":true,"InitialPaymentOnRecurring":"required","Parameters":[{"Name":"locale","DataType":"String","Required":false,"Description":"Locale"},{"Name":"itemName","DataType":"String","Required":false},{"Name":"description","DataType":"String","Required":false}],"image":{"svg":"https://external.findock.com/icon/payment-methods/creditcard.svg"}}]},' +
        '{"Name":"Ideal","Processors":[' +
            '{"Name":"PaymentHub-Stripe","IsDefault":true,"SupportsRecurring":false,"InitialPaymentOnRecurring":"unsupported","Parameters":[' +
                '{"Name":"issuer","DataType":"Enum","Required":false,"Description":"The issuing bank.","Enum":[' +
                    '{"value":"abnamro","label":"ABN AMRO","image":{"svg":"https://images.findock.com/issuers/abnamro/issuer.svg"}},' +
                    '{"value":"ingbank","label":"ING","image":{"svg":"https://images.findock.com/issuers/ingbank/issuer.svg"}}]}],' +
            '"image":{"svg":"https://external.findock.com/icon/payment-methods/ideal.svg"}}]},' +
        '{"Name":"SEPA Direct Debit","Processors":[' +
            '{"Name":"PaymentHub-Stripe","IsDefault":true,"SupportsRecurring":true,"InitialPaymentOnRecurring":"unsupported","Parameters":[' +
                '{"Name":"iban","DataType":"String","Required":true,"Description":"IBAN","minLength":15,"maxLength":34}],' +
            '"image":{"svg":"https://external.findock.com/icon/payment-methods/sepadirectdebit.svg"}}]},' +
        '{"Name":"Swish","Processors":[{"Name":"Swish-for-FinDock","IsDefault":true,"SupportsRecurring":false,"Parameters":[],"image":{"svg":"https://external.findock.com/icon/payment-methods/swish.svg"}}]}' +
    ']}';

    private static FinDockGatewayStub install() {
        FinDockGatewayStub stub = new FinDockGatewayStub();
        stub.methodsBody = METHODS_JSON;
        DonationPaymentService.gateway = stub;
        DonationSettings.overrideRecord = new Donation_Page_Setting__mdt(
            DeveloperName = 'Default',
            Organisation_Name__c = 'Test Charity',
            Currency_ISO_Code__c = 'eur',
            Payment_Processor__c = 'PaymentHub-Stripe',
            Payer_Record_Type__c = 'PersonAccount',
            One_Time_Methods__c = 'Ideal, CreditCard,SEPA Direct Debit,Missing Method',
            Recurring_Methods__c = 'SEPA Direct Debit,CreditCard,Ideal',
            One_Time_Presets__c = '10|Water for a week,25,50|Filter,abc',
            Recurring_Presets__c = '5|Year of water,10',
            Min_Amount__c = 5,
            Max_Amount__c = 1000,
            Origin__c = 'Unit test page',
            Support_Email__c = 'help@example.org',
            Allowed_Return_Hosts__c = 'donate.example.org'
        );
        return stub;
    }

    private static DonationPaymentService.IntentRequest validRequest() {
        DonationPaymentService.IntentRequest r = new DonationPaymentService.IntentRequest();
        r.frequency = 'oneTime';
        r.amount = 25;
        r.paymentMethod = 'Ideal';
        r.parameters = new Map<String, String>{ 'issuer' => 'ingbank' };
        r.firstName = 'Ada';
        r.lastName = 'Lovelace';
        r.email = 'ada@example.org';
        r.successUrl = 'https://donate.example.org/donate/thank-you';
        r.failureUrl = 'https://donate.example.org/donate/failed';
        return r;
    }

    @IsTest
    static void configFiltersMethodsAndParsesPresets() {
        install();
        DonationPaymentService.ConfigResponse cfg = DonationPaymentService.getConfig();

        System.assertEquals('Test Charity', cfg.organisationName);
        System.assertEquals('EUR', cfg.currencyCode);
        System.assertEquals(5, cfg.minAmount);
        System.assertEquals(1000, cfg.maxAmount);
        System.assertEquals(3, cfg.oneTimePresets.size(), 'non-numeric preset dropped');
        System.assertEquals('Water for a week', cfg.oneTimePresets[0].impactHint);
        System.assertEquals(null, cfg.oneTimePresets[1].impactHint);

        System.assertEquals(3, cfg.oneTimeMethods.size(), 'unknown method dropped, order preserved');
        System.assertEquals('Ideal', cfg.oneTimeMethods[0].name);
        System.assertEquals('iDEAL', cfg.oneTimeMethods[0].label);
        System.assertEquals('https://external.findock.com/icon/payment-methods/ideal.svg', cfg.oneTimeMethods[0].imageUrl);
        System.assertEquals(2, cfg.oneTimeMethods[0].parameters[0].options.size(), 'enum options carried through');
        System.assertEquals('ABN AMRO', cfg.oneTimeMethods[0].parameters[0].options[0].label);
        System.assertEquals('PaymentHub-Stripe', cfg.oneTimeMethods[1].processor, 'preferred processor wins over default');
        System.assertEquals('required', cfg.oneTimeMethods[1].initialPaymentOnRecurring);

        System.assertEquals(2, cfg.recurringMethods.size(), 'iDEAL does not support recurring');
        System.assertEquals('SEPA Direct Debit', cfg.recurringMethods[0].name);
        System.assertEquals(15, cfg.recurringMethods[0].parameters[0].minLength);
    }

    @IsTest
    static void configFallsBackToDefaultProcessorWhenPreferredMissing() {
        install();
        DonationSettings.overrideRecord.Payment_Processor__c = null;
        DonationPaymentService.ConfigResponse cfg = DonationPaymentService.getConfig();
        System.assertEquals('PaymentHub-Adyen', cfg.oneTimeMethods[1].processor);
    }

    @IsTest
    static void configSurvivesGatewayFailure() {
        FinDockGatewayStub stub = install();
        stub.methodsStatus = 500;
        stub.methodsBody = 'boom';
        DonationPaymentService.ConfigResponse cfg = DonationPaymentService.getConfig();
        System.assertEquals(0, cfg.oneTimeMethods.size());
        System.assertEquals('Test Charity', cfg.organisationName);
    }

    @IsTest
    static void oneTimeIntentIsBuiltForPersonAccountPayer() {
        FinDockGatewayStub stub = install();
        DonationPaymentService.IntentResponse res = DonationPaymentService.createIntent(validRequest(), 'donate.example.org');

        System.assertEquals('redirect', res.status);
        System.assertEquals('https://redirect.test.findock.com/checkout/abc', res.redirectUrl);
        System.assertEquals('pi_test123', res.paymentIntentId);

        Map<String, Object> intent = (Map<String, Object>) JSON.deserializeUntyped(stub.lastIntentBody);
        System.assertEquals('https://donate.example.org/donate/thank-you', intent.get('SuccessURL'));
        System.assertEquals('Unit test page', intent.get('Origin'));
        System.assert(!intent.containsKey('Recurring'));
        Map<String, Object> oneTime = (Map<String, Object>) intent.get('OneTime');
        System.assertEquals(25, oneTime.get('Amount'));
        System.assertEquals('EUR', oneTime.get('CurrencyISOCode'));

        Map<String, Object> payer = (Map<String, Object>) intent.get('Payer');
        Map<String, Object> account = (Map<String, Object>) payer.get('Account');
        System.assertEquals('PersonAccount', account.get('RecordTypeName'));
        Map<String, Object> fields = (Map<String, Object>) account.get('SalesforceFields');
        System.assertEquals('Lovelace', fields.get('LastName'));
        System.assertEquals('ada@example.org', fields.get('PersonEmail'));

        Map<String, Object> pm = (Map<String, Object>) intent.get('PaymentMethod');
        System.assertEquals('Ideal', pm.get('Name'));
        System.assertEquals('PaymentHub-Stripe', pm.get('Processor'));
        System.assertEquals('ingbank', ((Map<String, Object>) pm.get('Parameters')).get('issuer'));
        System.assert(!intent.containsKey('Settings'), 'no source connector configured');
    }

    @IsTest
    static void contactPayerWhenNoRecordTypeConfigured() {
        FinDockGatewayStub stub = install();
        DonationSettings.overrideRecord.Payer_Record_Type__c = null;
        DonationSettings.overrideRecord.Source_Connector__c = 'PaymentHub';
        DonationPaymentService.IntentRequest r = validRequest();
        r.firstName = null;
        DonationPaymentService.createIntent(r, 'donate.example.org');

        Map<String, Object> intent = (Map<String, Object>) JSON.deserializeUntyped(stub.lastIntentBody);
        Map<String, Object> payer = (Map<String, Object>) intent.get('Payer');
        Map<String, Object> fields = (Map<String, Object>) ((Map<String, Object>) payer.get('Contact')).get('SalesforceFields');
        System.assertEquals('ada@example.org', fields.get('Email'));
        System.assert(!fields.containsKey('FirstName'));
        System.assertEquals('PaymentHub', ((Map<String, Object>) intent.get('Settings')).get('SourceConnector'));
    }

    @IsTest
    static void monthlyIntentWithoutInitialPaymentStartsToday() {
        FinDockGatewayStub stub = install();
        DonationPaymentService.IntentRequest r = validRequest();
        r.frequency = 'monthly';
        r.amount = 10;
        r.paymentMethod = 'SEPA Direct Debit';
        r.parameters = new Map<String, String>{ 'iban' => 'NL91ABNA0417164300' };
        DonationPaymentService.createIntent(r, 'donate.example.org');

        Map<String, Object> intent = (Map<String, Object>) JSON.deserializeUntyped(stub.lastIntentBody);
        Map<String, Object> rec = (Map<String, Object>) intent.get('Recurring');
        System.assertEquals('Monthly', rec.get('Frequency'));
        System.assertEquals(String.valueOf(Date.today()), rec.get('StartDate'));
        System.assertEquals(10, rec.get('Amount'));
        System.assert(!intent.containsKey('OneTime'), 'no initial payment for SEPA');
    }

    @IsTest
    static void monthlyIntentWithRequiredInitialPaymentAddsOneTimeAndShiftsStart() {
        FinDockGatewayStub stub = install();
        DonationPaymentService.IntentRequest r = validRequest();
        r.frequency = 'monthly';
        r.paymentMethod = 'CreditCard';
        r.parameters = null;
        DonationPaymentService.createIntent(r, 'donate.example.org');

        Map<String, Object> intent = (Map<String, Object>) JSON.deserializeUntyped(stub.lastIntentBody);
        Map<String, Object> rec = (Map<String, Object>) intent.get('Recurring');
        System.assertEquals(String.valueOf(Date.today().addMonths(1)), rec.get('StartDate'));
        System.assertEquals(25, ((Map<String, Object>) intent.get('OneTime')).get('Amount'));
    }

    @IsTest
    static void rejectsPolicyViolations() {
        install();
        String host = 'donate.example.org';

        DonationPaymentService.IntentRequest r = validRequest();
        r.amount = 2;
        System.assertEquals('amount', DonationPaymentService.createIntent(r, host).errors[0].field);

        r = validRequest(); r.amount = 5000;
        System.assertEquals('amount', DonationPaymentService.createIntent(r, host).errors[0].field);

        r = validRequest(); r.amount = 10.123;
        System.assertEquals('amount', DonationPaymentService.createIntent(r, host).errors[0].field);

        r = validRequest(); r.email = 'not-an-email';
        System.assertEquals('email', DonationPaymentService.createIntent(r, host).errors[0].field);

        r = validRequest(); r.lastName = '  ';
        System.assertEquals('lastName', DonationPaymentService.createIntent(r, host).errors[0].field);

        r = validRequest(); r.frequency = 'weekly';
        System.assertEquals('frequency', DonationPaymentService.createIntent(r, host).errors[0].field);

        r = validRequest(); r.paymentMethod = 'Swish'; // active in org but not offered
        System.assertEquals('paymentMethod', DonationPaymentService.createIntent(r, host).errors[0].field);

        r = validRequest(); r.frequency = 'monthly'; r.paymentMethod = 'Ideal'; // offered but no recurring support
        System.assertEquals('paymentMethod', DonationPaymentService.createIntent(r, host).errors[0].field);

        r = validRequest(); r.paymentMethod = 'Missing Method';
        System.assertEquals('paymentMethod', DonationPaymentService.createIntent(r, host).errors[0].field);

        r = validRequest(); r.successUrl = 'https://evil.example.com/steal';
        System.assertEquals('successUrl', DonationPaymentService.createIntent(r, host).errors[0].field);

        r = validRequest(); r.failureUrl = 'http://donate.example.org/failed';
        System.assertEquals('failureUrl', DonationPaymentService.createIntent(r, host).errors[0].field);

        r = validRequest(); r.campaignId = 'nope';
        System.assertEquals('campaignId', DonationPaymentService.createIntent(r, host).errors[0].field);

        r = validRequest(); r.parameters = new Map<String, String>{ 'issuer' => 'rabobank' };
        DonationPaymentService.IntentResponse res = DonationPaymentService.createIntent(r, host);
        System.assertEquals('invalid', res.status);
        System.assertEquals('parameters.issuer', res.errors[0].field);

        r = validRequest(); r.paymentMethod = 'SEPA Direct Debit'; r.parameters = new Map<String, String>();
        System.assertEquals('parameters.iban', DonationPaymentService.createIntent(r, host).errors[0].field);

        r = validRequest(); r.paymentMethod = 'SEPA Direct Debit'; r.parameters = new Map<String, String>{ 'iban' => 'NL91' };
        System.assertEquals('parameters.iban', DonationPaymentService.createIntent(r, host).errors[0].field);

        System.assertEquals('invalid', DonationPaymentService.createIntent(null, host).status);
    }

    @IsTest
    static void returnUrlAcceptsRequestHostOrgDomainAndSalesforceSites() {
        FinDockGatewayStub stub = install();
        DonationSettings.overrideRecord.Allowed_Return_Hosts__c = null;

        DonationPaymentService.IntentRequest r = validRequest();
        r.successUrl = 'https://charity.my.site.com/donate/thank-you';
        r.failureUrl = 'https://charity.my.site.com/donate/failed';
        System.assertEquals('redirect', DonationPaymentService.createIntent(r, null).status);

        r.successUrl = 'https://custom-host.test/thank-you';
        r.failureUrl = 'https://custom-host.test/failed';
        System.assertEquals('redirect', DonationPaymentService.createIntent(r, 'custom-host.test:443').status);
        System.assertEquals('invalid', DonationPaymentService.createIntent(r, 'other-host.test').status);

        String orgHost = URL.getOrgDomainUrl().getHost();
        r.successUrl = 'https://' + orgHost + '/ok';
        r.failureUrl = 'https://' + orgHost + '/ko';
        System.assertEquals('redirect', DonationPaymentService.createIntent(r, null).status);
        System.assertNotEquals(null, stub.lastIntentBody);
    }

    @IsTest
    static void unknownParametersAreDroppedNotForwarded() {
        FinDockGatewayStub stub = install();
        DonationPaymentService.IntentRequest r = validRequest();
        r.parameters = new Map<String, String>{ 'issuer' => 'abnamro', 'Amount' => '99999', 'Target' => 'x' };
        DonationPaymentService.createIntent(r, 'donate.example.org');
        Map<String, Object> intent = (Map<String, Object>) JSON.deserializeUntyped(stub.lastIntentBody);
        Map<String, Object> params = (Map<String, Object>) ((Map<String, Object>) intent.get('PaymentMethod')).get('Parameters');
        System.assertEquals(1, params.size());
        System.assertEquals('abnamro', params.get('issuer'));
    }

    @IsTest
    static void successWithoutRedirectIsInlineSuccess() {
        FinDockGatewayStub stub = install();
        stub.intentBody = '{"Id":"pi_1"}';
        DonationPaymentService.IntentResponse res = DonationPaymentService.createIntent(validRequest(), 'donate.example.org');
        System.assertEquals('success', res.status);
        System.assertEquals('pi_1', res.paymentIntentId);
    }

    @IsTest
    static void recoverableFinDockErrorsAreMappedToFields() {
        FinDockGatewayStub stub = install();
        stub.intentStatus = 422;
        stub.intentBody = '{"Errors":[{"error_code":"202","error_message":"IBAN NL91 is not valid."}]}';
        DonationPaymentService.IntentResponse res = DonationPaymentService.createIntent(validRequest(), 'donate.example.org');
        System.assertEquals('recoverable', res.status);
        System.assertEquals('202', res.errors[0].code);
        System.assertEquals('parameters.iban', res.errors[0].field);
    }

    @IsTest
    static void nonRecoverableErrorsAreGenericAndMixedBatchesFail() {
        FinDockGatewayStub stub = install();
        stub.intentStatus = 422;
        stub.intentBody = '{"Errors":[{"error_code":"202","error_message":"IBAN"},{"error_code":"200","error_message":"Amount can\'t be 0"}]}';
        DonationPaymentService.IntentResponse res = DonationPaymentService.createIntent(validRequest(), 'donate.example.org');
        System.assertEquals('failed', res.status);
        System.assertEquals(1, res.errors.size());
        System.assertEquals('999', res.errors[0].code);
        System.assert(!res.errors[0].message.contains('Amount'), 'raw FinDock text must not leak');

        stub.intentBody = '{"error_code":998,"error_message":"No default target"}';
        System.assertEquals('failed', DonationPaymentService.createIntent(validRequest(), 'donate.example.org').status);

        stub.intentStatus = 500;
        stub.intentBody = '<html>oops</html>';
        System.assertEquals('failed', DonationPaymentService.createIntent(validRequest(), 'donate.example.org').status);
    }

    @IsTest
    static void campaignFromUrlOnlyUsedWhenActive() {
        FinDockGatewayStub stub = install();
        Campaign active = new Campaign(Name = 'Active', IsActive = true);
        Campaign inactive = new Campaign(Name = 'Inactive', IsActive = false);
        insert new List<Campaign>{ active, inactive };
        DonationSettings.overrideRecord.Default_Campaign_Id__c = active.Id;

        DonationPaymentService.IntentRequest r = validRequest();
        r.campaignId = inactive.Id;
        DonationPaymentService.createIntent(r, 'donate.example.org');
        Map<String, Object> intent = (Map<String, Object>) JSON.deserializeUntyped(stub.lastIntentBody);
        System.assertEquals(active.Id, intent.get('CampaignId'), 'inactive campaign falls back to default');

        r.campaignId = null;
        DonationSettings.overrideRecord.Default_Campaign_Id__c = null;
        DonationPaymentService.createIntent(r, 'donate.example.org');
        intent = (Map<String, Object>) JSON.deserializeUntyped(stub.lastIntentBody);
        System.assert(!intent.containsKey('CampaignId'));

        Campaign fresh = new Campaign(Name = 'Fresh', IsActive = true);
        insert fresh;
        r.campaignId = fresh.Id;
        DonationPaymentService.createIntent(r, 'donate.example.org');
        intent = (Map<String, Object>) JSON.deserializeUntyped(stub.lastIntentBody);
        System.assertEquals(fresh.Id, intent.get('CampaignId'));
    }

    @IsTest
    static void settingsDefaultsWhenRecordMissingFields() {
        DonationSettings.overrideRecord = new Donation_Page_Setting__mdt(DeveloperName = 'Default');
        DonationSettings s = DonationSettings.load();
        System.assertEquals('EUR', s.currencyCode);
        System.assertEquals(1, s.minAmount);
        System.assertEquals(4, s.oneTimePresets.size());
        System.assertEquals(0, s.oneTimeMethods.size());
        System.assertEquals('Credit or debit card', DonationPaymentService.displayLabel('CreditCard'));
        System.assertEquals('Holder Name', DonationPaymentService.displayLabel('HolderName').replace('Account holder name', 'Holder Name'));
    }

    @IsTest
    static void merchantParametersDefaultToGiftLabel() {
        FinDockGatewayStub stub = install();
        DonationPaymentService.IntentRequest r = validRequest();
        r.frequency = 'monthly';
        r.paymentMethod = 'CreditCard';
        r.parameters = new Map<String, String>{ 'locale' => 'nl-NL' };
        DonationPaymentService.createIntent(r, 'donate.example.org');
        Map<String, Object> intent = (Map<String, Object>) JSON.deserializeUntyped(stub.lastIntentBody);
        Map<String, Object> params = (Map<String, Object>) ((Map<String, Object>) intent.get('PaymentMethod')).get('Parameters');
        System.assertEquals('nl-NL', params.get('locale'));
        System.assertEquals('Monthly gift to Test Charity', params.get('itemName'));
        System.assertEquals('Monthly gift to Test Charity', params.get('description'));
    }
}
