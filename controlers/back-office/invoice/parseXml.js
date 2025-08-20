const xml2js = require('xml2js');
const { parseStringPromise } = require('xml2js');



  function parseInvoiceData (invoiceData, id) {
    console.log(invoiceData)

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
    const products = invoiceData.Invoice["cac:InvoiceLine"].map(item => {
        // Extract the name of the item
        const itemName = Array.isArray(item["cac:Item"][0]["cbc:Name"]) 
          ? item["cac:Item"][0]["cbc:Name"][0]["_"] || item["cac:Item"][0]["cbc:Name"][0] 
          : item["cac:Item"][0]["cbc:Name"];
      
        // Extract the VAT percent
        const vatPercent = Array.isArray(item["cac:Item"][0]["cac:ClassifiedTaxCategory"][0]["cbc:Percent"]) 
          ? +item["cac:Item"][0]["cac:ClassifiedTaxCategory"][0]["cbc:Percent"][0]["_"] || +item["cac:Item"][0]["cac:ClassifiedTaxCategory"][0]["cbc:Percent"][0] 
          : 0;
      
        // Extract price amount
        const price = item["cac:Price"] && item["cac:Price"][0]["cbc:PriceAmount"]
          ? +item["cac:Price"][0]["cbc:PriceAmount"][0]["_"] || +item["cac:Price"][0]["cbc:PriceAmount"][0]
          : 0;
      console.log(item)
        // Extract quantity and unit code
        // const iq = item["cbc:InvoicedQuantity"]?.[0];

        // let quantity = 0;
        // let unitCode = 'N/A';

        // if (iq) {
        //   if (typeof iq === 'object') {
        //     // handle both "1.000" and "1,000" and also negative values
        //     const raw = iq._.replace(',', '.');
        //     quantity = parseFloat(raw);
        //     unitCode = iq.$?.unitCode || unitCode;
        //   }
        // }
        // // const quantity = parseFloat(iq && typeof iq === 'object' ? iq._.replace(',', '.') : iq) || 0;

        const invoicedQuantity = item["cbc:InvoicedQuantity"] && item["cbc:InvoicedQuantity"][0];
        const quantity = invoicedQuantity ? +invoicedQuantity["_"] : 0;
        const unitCode = invoicedQuantity && invoicedQuantity["$"] ? invoicedQuantity["$"].unitCode : 'N/A';
      
        // Extract total amount excluding VAT
        const totalNoVat = item["cbc:LineExtensionAmount"] 
          ? +item["cbc:LineExtensionAmount"][0]["_"] || +item["cbc:LineExtensionAmount"][0] 
          : 0;
      
        return {
          name: itemName,
          quantity: quantity,
          unitCode: unitCode,
          price: price,
          totalNoVat: totalNoVat,
          vatPrecent: vatPercent
        };
      })

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
      vatPercent
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