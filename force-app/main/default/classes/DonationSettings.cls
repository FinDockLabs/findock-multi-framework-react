/**
 * Typed view over the Donation_Page_Setting__mdt "Default" record.
 * Everything that differs between orgs (currency, processor, payer record type, offered
 * methods, amount bounds, presets) lives here instead of being hardcoded in the service.
 */
public with sharing class DonationSettings {

    public class Preset {
        public Decimal amount;
        public String impactHint;
        public Preset(Decimal amount, String impactHint) {
            this.amount = amount;
            this.impactHint = impactHint;
        }
    }

    public String organisationName;
    public String currencyCode;
    public String processor;
    public String sourceConnector;
    public String payerRecordType;
    public String origin;
    public String supportEmail;
    public String defaultCampaignId;
    public Decimal minAmount;
    public Decimal maxAmount;
    public List<String> oneTimeMethods;
    public List<String> recurringMethods;
    public List<Preset> oneTimePresets;
    public List<Preset> recurringPresets;
    public List<String> allowedReturnHosts;

    @TestVisible
    private static Donation_Page_Setting__mdt overrideRecord;

    public static DonationSettings load() {
        Donation_Page_Setting__mdt rec = overrideRecord != null
            ? overrideRecord
            : Donation_Page_Setting__mdt.getInstance('Default');
        if (rec == null) {
            rec = new Donation_Page_Setting__mdt();
        }
        DonationSettings s = new DonationSettings();
        s.organisationName = defaultIfBlank(rec.Organisation_Name__c, 'Our organisation');
        s.currencyCode = defaultIfBlank(rec.Currency_ISO_Code__c, 'EUR').toUpperCase();
        s.processor = blankToNull(rec.Payment_Processor__c);
        s.sourceConnector = blankToNull(rec.Source_Connector__c);
        s.payerRecordType = blankToNull(rec.Payer_Record_Type__c);
        s.origin = defaultIfBlank(rec.Origin__c, 'Donation page');
        s.supportEmail = blankToNull(rec.Support_Email__c);
        s.defaultCampaignId = blankToNull(rec.Default_Campaign_Id__c);
        s.minAmount = rec.Min_Amount__c == null ? 1 : rec.Min_Amount__c;
        s.maxAmount = rec.Max_Amount__c == null ? 10000 : rec.Max_Amount__c;
        s.oneTimeMethods = splitList(rec.One_Time_Methods__c);
        s.recurringMethods = splitList(rec.Recurring_Methods__c);
        s.oneTimePresets = parsePresets(defaultIfBlank(rec.One_Time_Presets__c, '10,25,50,100'));
        s.recurringPresets = parsePresets(defaultIfBlank(rec.Recurring_Presets__c, '5,10,20'));
        s.allowedReturnHosts = new List<String>();
        for (String h : splitList(rec.Allowed_Return_Hosts__c)) {
            s.allowedReturnHosts.add(h.toLowerCase());
        }
        return s;
    }

    /** "10|Feeds a family,25,50|Repairs a pump" -> presets with optional impact hints. */
    @TestVisible
    private static List<Preset> parsePresets(String raw) {
        List<Preset> presets = new List<Preset>();
        for (String token : splitList(raw)) {
            List<String> parts = token.split('\\|', 2);
            String amountText = parts[0].trim();
            if (!amountText.isNumeric() && !Pattern.matches('^\\d+(\\.\\d{1,2})?$', amountText)) {
                continue;
            }
            String impactHint = parts.size() > 1 ? parts[1].trim() : null;
            presets.add(new Preset(Decimal.valueOf(amountText), String.isBlank(impactHint) ? null : impactHint));
        }
        return presets;
    }

    private static List<String> splitList(String raw) {
        List<String> values = new List<String>();
        if (String.isBlank(raw)) {
            return values;
        }
        for (String part : raw.split(',')) {
            if (String.isNotBlank(part)) {
                values.add(part.trim());
            }
        }
        return values;
    }

    private static String defaultIfBlank(String value, String fallback) {
        return String.isBlank(value) ? fallback : value.trim();
    }

    private static String blankToNull(String value) {
        return String.isBlank(value) ? null : value.trim();
    }
}
