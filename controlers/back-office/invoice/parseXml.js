const xml2js = require('xml2js');
const { parseStringPromise } = require('xml2js');



  function parseInvoiceData (invoiceData, id) {
    const suplierIban = invoiceData.Invoice["cac:PaymentMeans"]?.[0]?.['cac:PayeeFinancialAccount']?.[0]

    const iban = suplierIban?.['cbc:ID'] ? suplierIban?.['cbc:ID'][0] : 'NO IBAN'
    const bank = suplierIban?.['cbc:Name'] ? suplierIban?.['cbc:Name'][0] : 'NO NAME'

   const invoiceNumber = Array.isArray(invoiceData.Invoice["cbc:ID"]) 
    ? (invoiceData.Invoice["cbc:ID"][0]["_"] || invoiceData.Invoice["cbc:ID"][0]) 
    : invoiceData.Invoice["cbc:ID"] || 'Unknown';

   const issueDate = Array.isArray(invoiceData.Invoice["cbc:IssueDate"]) 
    ? (invoiceData.Invoice["cbc:IssueDate"][0]["_"] || invoiceData.Invoice["cbc:IssueDate"][0]) 
    : invoiceData.Invoice["cbc:IssueDate"] || 'Unknown';

   const dueDate = Array.isArray(invoiceData.Invoice["cbc:DueDate"]) 
    ? (invoiceData.Invoice["cbc:DueDate"][0]["_"] || invoiceData.Invoice["cbc:DueDate"][0]) 
    : (Array.isArray(invoiceData.Invoice["cbc:IssueDate"]) 
        ? (invoiceData.Invoice["cbc:IssueDate"][0]["_"] || invoiceData.Invoice["cbc:IssueDate"][0]) 
        : invoiceData.Invoice["cbc:IssueDate"]) || 'Unknown';

   const supplier = {
    name: Array.isArray(invoiceData.Invoice["cac:AccountingSupplierParty"]) && 
            Array.isArray(invoiceData.Invoice["cac:AccountingSupplierParty"][0]["cac:Party"]) && 
            Array.isArray(invoiceData.Invoice["cac:AccountingSupplierParty"][0]["cac:Party"][0]["cac:PartyLegalEntity"]) 
        ? (invoiceData.Invoice["cac:AccountingSupplierParty"][0]["cac:Party"][0]["cac:PartyLegalEntity"][0]["cbc:RegistrationName"][0]["_"] || 
        invoiceData.Invoice["cac:AccountingSupplierParty"][0]["cac:Party"][0]["cac:PartyLegalEntity"][0]["cbc:RegistrationName"][0]) 
        : 'Unknown Supplier',
    vatNumber: Array.isArray(invoiceData.Invoice["cac:AccountingSupplierParty"]) && 
                Array.isArray(invoiceData.Invoice["cac:AccountingSupplierParty"][0]["cac:Party"]) && 
                Array.isArray(invoiceData.Invoice["cac:AccountingSupplierParty"][0]["cac:Party"][0]["cac:PartyTaxScheme"]) 
        ? (invoiceData.Invoice["cac:AccountingSupplierParty"][0]["cac:Party"][0]["cac:PartyTaxScheme"][0]["cbc:CompanyID"][0]["_"] || 
        invoiceData.Invoice["cac:AccountingSupplierParty"][0]["cac:Party"][0]["cac:PartyTaxScheme"][0]["cbc:CompanyID"][0]) 
        : 'Unknown VAT Number',
      iban: iban,
      bank: bank
    };

    const customerParty = invoiceData.Invoice["cac:AccountingCustomerParty"]?.[0]?.["cac:Party"]?.[0];

    const customer = {
      name: customerParty?.["cac:PartyLegalEntity"]?.[0]?.["cbc:RegistrationName"]?.[0]
        ? getText(customerParty["cac:PartyLegalEntity"][0]["cbc:RegistrationName"][0])
        : 'Unknown Customer',
    
      vatNumber: customerParty?.["cac:PartyTaxScheme"]?.[0]?.["cbc:CompanyID"]?.[0]
        ? getText(customerParty["cac:PartyTaxScheme"][0]["cbc:CompanyID"][0])
        : 'Unknown VAT Number'
    };

    console.log(invoiceData.invoice)

    const products = invoiceData.Invoice["cac:InvoiceLine"].map(item => {
      // ------- helpers -------
      const getNum = v =>
        v == null ? 0 :
        (typeof v === 'object' && '_' in v) ? +v._ :
        +v;
    
      const getBool = v => {
        // handles true/false, "true"/"false", objects with "_" etc.
        const raw = (typeof v === 'object' && '_' in v) ? v._ : v;
        return String(raw).toLowerCase() === 'true';
      };
    
      // ------- core fields -------
      const itemName = Array.isArray(item["cac:Item"]?.[0]?.["cbc:Name"])
        ? (item["cac:Item"][0]["cbc:Name"][0]["_"] || item["cac:Item"][0]["cbc:Name"][0])
        : item["cac:Item"]?.[0]?.["cbc:Name"] || 'Unknown item';
    
      const vatPercent = Array.isArray(item["cac:Item"]?.[0]?.["cac:ClassifiedTaxCategory"]?.[0]?.["cbc:Percent"])
        ? +item["cac:Item"][0]["cac:ClassifiedTaxCategory"][0]["cbc:Percent"][0]["_"] ||
          +item["cac:Item"][0]["cac:ClassifiedTaxCategory"][0]["cbc:Percent"][0]
        : 0;
    
      // const price = item["cac:Price"]?.[0]?.["cbc:PriceAmount"]
      //   ? +item["cac:Price"][0]["cbc:PriceAmount"][0]["_"] ||
      //     +item["cac:Price"][0]["cbc:PriceAmount"][0]
      //   : 0;

        const price = item["cac:Price"] && item["cac:Price"][0]["cbc:PriceAmount"]
          ? +item["cac:Price"][0]["cbc:PriceAmount"][0]["_"] || +item["cac:Price"][0]["cbc:PriceAmount"][0]
          : 0;
    
      const invoicedQuantity = item["cbc:InvoicedQuantity"]?.[0];
      const quantity = invoicedQuantity ? parseFloat(invoicedQuantity["_"] ?? invoicedQuantity) : 0;
      const unitCode = invoicedQuantity?.["$"]?.unitCode || 'N/A';
    
      const totalNoVat = item["cbc:LineExtensionAmount"]
        ? +item["cbc:LineExtensionAmount"][0]["_"] || +item["cbc:LineExtensionAmount"][0]
        : 0;
    
      // ------- discounts (AllowanceCharge) -------
      // A) Price-level discount: per-unit
      const priceAllowances = item["cac:Price"]?.[0]?.["cac:AllowanceCharge"] || [];
      let perUnitDiscount = 0;
      let perUnitBase = 0;
    
      for (const ac of priceAllowances) {
        const isCharge = getBool(ac["cbc:ChargeIndicator"]?.[0]);
        if (!isCharge) {
          // it's a discount
          perUnitDiscount += getNum(ac["cbc:Amount"]?.[0]);
          // base amount is per-unit base price before discount (if present)
          perUnitBase += getNum(ac["cbc:BaseAmount"]?.[0]);
        }
      }
    
      // B) Line-level discount: total for the line
      const lineAllowances = item["cac:AllowanceCharge"] || [];
      let lineDiscountTotal = 0;
      for (const ac of lineAllowances) {
        const isCharge = getBool(ac["cbc:ChargeIndicator"]?.[0]);
        if (!isCharge) {
          lineDiscountTotal += getNum(ac["cbc:Amount"]?.[0]);
        }
      }
    
      // Totals
      let discountPerUnit = perUnitDiscount; // RON per unit (e.g., per kg/piece)
      const discountFromPriceLevel = quantity ? +(discountPerUnit * quantity).toFixed(2) : 0; // total for the line
      const discountTotal = +(discountFromPriceLevel + lineDiscountTotal).toFixed(2);
      if(discountPerUnit === 0 && discountTotal > 0) discountPerUnit = +(discountTotal / quantity).toFixed(2)
    
      // Percent (best-effort): prefer per-unit base; else infer from totals if possible
      let discountPercent = 0;
      const effectiveBasePerUnit = perUnitBase || price; // fall back to priceAmount if base missing
      if (effectiveBasePerUnit > 0 && discountPerUnit > 0) {
        discountPercent = +( (discountPerUnit / effectiveBasePerUnit) * 100 ).toFixed(2);
      } else if (totalNoVat > 0 && discountTotal > 0) {
        // rough fallback: discount vs. (discount + net) as approximation
        discountPercent = +( (discountTotal / (discountTotal + totalNoVat)) * 100 ).toFixed(2);
      }
    
      return {
        name: itemName,
        quantity,
        unitCode,
        price: price - discountPerUnit,               // net unit price after price-level discount (as per your sample)
        totalNoVat,
        vatPrecent: vatPercent,
    
        // NEW fields
        discountPerUnit,     // RON/unit from price-level AllowanceCharge (0 if none)
        discountTotal,       // total RON discount for this line (price-level * qty + line-level)
        discountPercent      // % (best-effort)
      };
    });
    



      const vatAmount = +invoiceData.Invoice["cac:TaxTotal"][0]["cbc:TaxAmount"][0]["_"];
      const  taxExclusiveAmount = +invoiceData.Invoice["cac:LegalMonetaryTotal"][0]["cbc:TaxExclusiveAmount"][0]["_"];
      const  taxInclusiveAmount = +invoiceData.Invoice["cac:LegalMonetaryTotal"][0]["cbc:TaxInclusiveAmount"][0]["_"];
      const  prePaydAmount = invoiceData.Invoice["cac:LegalMonetaryTotal"][0]["cbc:PrepaidAmount"] ? +invoiceData.Invoice["cac:LegalMonetaryTotal"][0]["cbc:PrepaidAmount"][0]["_"] : 0;
      const  payableAmont = +invoiceData.Invoice["cac:LegalMonetaryTotal"][0]["cbc:PayableAmount"][0]["_"]; 
      const  currencyId = invoiceData.Invoice["cac:LegalMonetaryTotal"][0]["cbc:PayableAmount"][0]["$"].currencyID;

    const invoiceSummary = {
        invoiceNumber, 
        issueDate, 
        dueDate, 
        supplier,
        customer,
        products,
        vatAmount, 
        taxExclusiveAmount,
        taxInclusiveAmount,
        prePaydAmount,
        payableAmont, 
        currencyId,
        id
      };
      return invoiceSummary
};



function parseCreditNoteData(creditData, id) {
  const cn = creditData.CreditNote;

  // Credit note number
  const creditNumber = Array.isArray(cn['cbc:ID'])
    ? (cn['cbc:ID'][0]['_'] || cn['cbc:ID'][0])
    : cn['cbc:ID'] || 'Unknown';

  // Date
  const issueDate = Array.isArray(cn['cbc:IssueDate'])
    ? (cn['cbc:IssueDate'][0]['_'] || cn['cbc:IssueDate'][0])
    : cn['cbc:IssueDate'] || 'Unknown';

  // Supplier
  const supplierParty = cn['cac:AccountingSupplierParty']?.[0]?.['cac:Party']?.[0];
  const supplier = {
    name: supplierParty?.['cac:PartyLegalEntity']?.[0]?.['cbc:RegistrationName']?.[0]
      ? getText(supplierParty['cac:PartyLegalEntity'][0]['cbc:RegistrationName'][0])
      : 'Unknown Supplier',
    vatNumber: supplierParty?.['cac:PartyTaxScheme']?.[0]?.['cbc:CompanyID']?.[0]
      ? getText(supplierParty['cac:PartyTaxScheme'][0]['cbc:CompanyID'][0])
      : 'Unknown VAT Number'
  };

  // Customer
  const customerParty = cn['cac:AccountingCustomerParty']?.[0]?.['cac:Party']?.[0];
  const customer = {
    name: customerParty?.['cac:PartyLegalEntity']?.[0]?.['cbc:RegistrationName']?.[0]
      ? getText(customerParty['cac:PartyLegalEntity'][0]['cbc:RegistrationName'][0])
      : 'Unknown Customer',
    vatNumber: customerParty?.['cac:PartyTaxScheme']?.[0]?.['cbc:CompanyID']?.[0]
      ? getText(customerParty['cac:PartyTaxScheme'][0]['cbc:CompanyID'][0])
      : 'Unknown VAT Number'
  };

  // Products lines
  const products = cn['cac:CreditNoteLine']?.map(line => {
    const item = line['cac:Item']?.[0] || {};
    const price = line['cac:Price']?.[0] || {};

    const name = item['cbc:Name']?.[0]?._ || item['cbc:Name']?.[0] || 'Unknown';
    const quantity = +line['cbc:CreditedQuantity']?.[0]?._ || +line['cbc:CreditedQuantity']?.[0] || 0;
    const unitCode = line['cbc:CreditedQuantity']?.[0]?.$?.unitCode || 'N/A';
    const priceAmount = +price['cbc:PriceAmount']?.[0]?._ || +price['cbc:PriceAmount']?.[0] || 0;
    const totalNoVat = +line['cbc:LineExtensionAmount']?.[0]?._ || +line['cbc:LineExtensionAmount']?.[0] || 0;
    const vatPercent = +item['cac:ClassifiedTaxCategory']?.[0]?.['cbc:Percent']?.[0]?._ || +item['cac:ClassifiedTaxCategory']?.[0]?.['cbc:Percent']?.[0] || 0;

    return {
      name,
      quantity: - quantity,
      unitCode,
      price: priceAmount,
      totalNoVat: totalNoVat,
      vatPrecent: vatPercent
    };
  }) || [];

  // Totals
  const vatAmount = +cn['cac:TaxTotal']?.[0]?.['cbc:TaxAmount']?.[0]?._ || 0;
  const taxExclusiveAmount = +cn['cac:LegalMonetaryTotal']?.[0]?.['cbc:TaxExclusiveAmount']?.[0]?._ || 0;
  const taxInclusiveAmount = +cn['cac:LegalMonetaryTotal']?.[0]?.['cbc:TaxInclusiveAmount']?.[0]?._ || 0;
  const prepayAmount = +cn['cac:LegalMonetaryTotal']?.[0]?.['cbc:PrepaidAmount']?.[0]?._ || 0;
  const payableAmount = +cn['cac:LegalMonetaryTotal']?.[0]?.['cbc:PayableAmount']?.[0]?._ || 0;
  const currencyId = cn['cac:LegalMonetaryTotal']?.[0]?.['cbc:PayableAmount']?.[0]?.$?.currencyID || 'N/A';

  return {
    creditNumber,
    issueDate,
    supplier,
    customer,
    products,
    vatAmount: -vatAmount,
    taxExclusiveAmount: -taxExclusiveAmount,
    taxInclusiveAmount: -taxInclusiveAmount,
    prepayAmount: -prepayAmount,
    payableAmount:  -payableAmount,
    currencyId,
    id
  };
}


const getText = (val) => {
    if (typeof val === 'string') return val;
    if (typeof val === 'object' && '_' in val) return val._;
    return val?.toString?.() || 'Unknown';
  };


  function parseXml(xmlData) {
    return new Promise((resolve, reject) => {
      xml2js.parseString(xmlData, (err, result) => {
        if (err) {
          return reject(err);
        }
        resolve(result);
      });
    });
  }

  async function parseHeaderFromXml(xml) {
    try {
      const result = await parseStringPromise(xml, {
        explicitArray: false,
        ignoreAttrs: false,
      });
      return result.header;
    } catch (error) {
      console.error("Error parsing XML:", error.message);
      throw error;
    }
  }

module.exports = {parseInvoiceData, parseXml, parseHeaderFromXml, parseCreditNoteData}