const {round} = require('../../../utils//functions')
const { create } = require('xmlbuilder2');



function buildEFacturaHeaderXML(invoice, date) {
  const isVatPayer = invoice.supplier.vat === 'VAT' ? true : false;
  const isVatPayerClient = invoice.client.vat === 'VAT' ? true : false;
    const doc = create({ version: '1.0' })
      .ele('Invoice', {
        xmlns: 'urn:oasis:names:specification:ubl:schema:xsd:Invoice-2',
        'xmlns:cac': 'urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2',
        'xmlns:cbc': 'urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2'
      });
  
    // Invoice metadata
        doc.ele('cbc:CustomizationID').txt('urn:cen.eu:en16931:2017#compliant#urn:efactura.mfinante.ro:CIUS-RO:1.0.1').up();
        doc.ele('cbc:ProfileID').txt('urn:fdc:peppol.eu:2017:poacc:billing:01:1.0').up();
        doc.ele('cbc:ID').txt(invoice.invoice ? invoice.invoiceNumber : invoice.invoiceNumber + " S").up(); // ensure this contains digits
        doc.ele('cbc:IssueDate').txt(invoice.invoice ? invoice.issueDate : date).up();
        doc.ele('cbc:DueDate').txt(invoice.dueDate).up();
        doc.ele('cbc:InvoiceTypeCode').txt(invoice.invoiceCode).up(); // standard invoice
        if(invoice.note) doc.ele('cbc:Note').txt(invoice.note).up()
        doc.ele('cbc:DocumentCurrencyCode').txt('RON').up();
        doc.ele('cbc:TaxCurrencyCode').txt('RON').up();


  
        if(!invoice.invoice){
          doc.ele('cac:BillingReference')
          .ele('cac:InvoiceDocumentReference')
          .ele('cbc:ID').txt(invoice.creditNoteRef).up()
          .ele('cbc:IssueDate').txt(invoice.issueDate);
        }
  
  
    // Supplier block
    const supplierParty = doc.ele('cac:AccountingSupplierParty').ele('cac:Party');
    supplierParty.ele('cac:PartyIdentification').ele('cbc:ID', { schemeID: '0209' }).txt(invoice.supplier.vatNumber.replace('RO', '') + '99995').up().up();
    supplierParty.ele('cac:PartyName').ele('cbc:Name').txt(invoice.supplier.name).up().up();
    const suppAddr = supplierParty.ele('cac:PostalAddress');
    suppAddr.ele('cbc:StreetName').txt(invoice.supplier.address.street).up();
    suppAddr.ele('cbc:CityName').txt(invoice.supplier.address.city).up();
    suppAddr.ele('cbc:PostalZone').txt(invoice.supplier.address.postalCode).up(); 
    suppAddr.ele('cbc:CountrySubentity').txt(invoice.supplier.address.coutrySubentity).up(); 
    suppAddr.ele('cac:Country').ele('cbc:IdentificationCode').txt(invoice.supplier.address.country).up().up();

    if(isVatPayer){
      supplierParty.ele('cac:PartyTaxScheme')
        .ele('cbc:CompanyID').txt(invoice.supplier.vatNumber).up()
        .ele('cac:TaxScheme').ele('cbc:ID').txt('VAT').up().up().up();
    }


    supplierParty.ele('cac:PartyLegalEntity')
      .ele('cbc:RegistrationName').txt(invoice.supplier.name).up()
      .ele('cbc:CompanyID').txt(invoice.supplier.registration).up().up();
      const contact = supplierParty.ele('cac:Contact');
      if (invoice.supplier.contact.name)
        contact.ele('cbc:Name').txt(invoice.supplier.contact.name).up();
      if (invoice.supplier.contact.email)
        contact.ele('cbc:ElectronicMail').txt(invoice.supplier.contact.email).up();
  



    // Customer block
    const customerParty = doc.ele('cac:AccountingCustomerParty').ele('cac:Party');
    customerParty.ele('cac:PartyName').ele('cbc:Name').txt(invoice.client.name).up().up();
    const custAddr = customerParty.ele('cac:PostalAddress');
    custAddr.ele('cbc:StreetName').txt(invoice.client.address.street).up();
    custAddr.ele('cbc:CityName').txt(invoice.client.address.city).up();
    custAddr.ele('cbc:PostalZone').txt(invoice.client.address.postalCode).up(); // example
    custAddr.ele('cbc:CountrySubentity').txt(invoice.client.address.coutrySubentity).up(); // example
    custAddr.ele('cac:Country').ele('cbc:IdentificationCode').txt(invoice.client.address.country).up().up();

    if(isVatPayerClient){
      customerParty.ele('cac:PartyTaxScheme')
        .ele('cbc:CompanyID').txt(invoice.client.vatNumber).up()
        .ele('cac:TaxScheme').ele('cbc:ID').txt('VAT').up().up().up();
    }

    customerParty.ele('cac:PartyLegalEntity')
      .ele('cbc:RegistrationName').txt(invoice.client.name).up()
      .ele('cbc:CompanyID').txt(invoice.client.registration).up().up();
  
  
    // Payment Means
    const paymentMeans = doc.ele('cac:PaymentMeans');
    paymentMeans.ele('cbc:PaymentMeansCode').txt('10').up();
    paymentMeans.ele('cac:PayeeFinancialAccount')
      .ele('cbc:ID').txt(invoice.paymentMeans.iban).up().up();
  
    let totalDiscount = 0

    if (Array.isArray(invoice.discount)) {
      invoice.discount.forEach(d => {
        totalDiscount += d.value
        const ac = doc.ele('cac:AllowanceCharge');
        ac.ele('cbc:ChargeIndicator').txt('false');
        if (d.reasonCode != null) ac.ele('cbc:AllowanceChargeReasonCode').txt(d.reasonCode.toString());
        if (d.reason) ac.ele('cbc:AllowanceChargeReason').txt(d.reason);
        if (d.precent != null) ac.ele('cbc:MultiplierFactorNumeric').txt(d.precent.toString());
        ac.ele('cbc:Amount', { currencyID: invoice.currencyId }).txt(d.value.toFixed(2));
        ac.ele('cbc:BaseAmount', { currencyID: invoice.currencyId }).txt(d.baseAmount.toFixed(2));
        const taxCategory = ac.ele('cac:TaxCategory');
        taxCategory.ele('cbc:ID').txt('S');
        taxCategory.ele('cbc:Percent').txt(d.vat.toString());
        taxCategory.ele('cac:TaxScheme').ele('cbc:ID').txt('VAT');
      });
    }


      //------------------------------------------------------------------
    // 2) TAX TOTAL
    //------------------------------------------------------------------
    const taxTotal = doc.ele('cac:TaxTotal');
    taxTotal.ele('cbc:TaxAmount', { currencyID: invoice.currencyId })
            .txt(isVatPayer ? round(invoice.vatAmount).toFixed(2) : '0.00');
  
  
    // const taxTotal = doc.ele('cac:TaxTotal');
    // taxTotal.ele('cbc:TaxAmount', { currencyID: invoice.currencyId }).txt(invoice.vatAmount).up();
  
    invoice.vatGroups.forEach(r => {
      let id =  r.rate === 0 ? 'Z': 'S'
      const subtotal = taxTotal.ele('cac:TaxSubtotal');
      subtotal.ele('cbc:TaxableAmount', { currencyID: invoice.currencyId }).txt(r.taxable).up();
      subtotal.ele('cbc:TaxAmount', { currencyID: invoice.currencyId }).txt(isVatPayer ? r.tax : '0.00').up();
      subtotal.ele('cac:TaxCategory')
        .ele('cbc:ID').txt(id).up()
        .ele('cbc:Percent').txt(isVatPayer ? r.rate : 0).up()
        .ele('cac:TaxScheme').ele('cbc:ID').txt('VAT').up().up().up();
    })


    
  
  //  LegalMonetaryTotal
    const total = doc.ele('cac:LegalMonetaryTotal');
    total.ele('cbc:LineExtensionAmount', { currencyID: invoice.currencyId }).txt(round(invoice.taxExclusiveAmount + totalDiscount)).up();
    total.ele('cbc:TaxExclusiveAmount', { currencyID: invoice.currencyId }).txt(invoice.taxExclusiveAmount).up();  
    total.ele('cbc:TaxInclusiveAmount', { currencyID: invoice.currencyId }).txt(invoice.taxInclusiveAmount).up();
    if((totalDiscount > 0 && invoice.invoice) || (totalDiscount < 0 || !invoice.invoice)) total.ele('cbc:AllowanceTotalAmount', { currencyID: invoice.currencyId }).txt(round(totalDiscount)).up();
    total.ele('cbc:PrepaidAmount', { currencyID: invoice.currencyId }).txt(0).up();
    total.ele('cbc:PayableAmount', { currencyID: invoice.currencyId }).txt(invoice.taxInclusiveAmount).up();



  
  

    invoice.products.forEach((p, i) => {
      const line = doc.ele('cac:InvoiceLine');
    
      line.ele('cbc:ID').txt((i + 1).toString());
      line.ele('cbc:InvoicedQuantity', { unitCode: p.unitCode }).txt(p.quantity);
      line.ele('cbc:LineExtensionAmount', { currencyID: invoice.currencyId }).txt(p.totalNoVat);
    
      // ✅ discount stays only on the line — not in price
      if (p.discount && p.discount.value > 0) {
        line.ele('cac:AllowanceCharge')
          .ele('cbc:ChargeIndicator').txt('false').up()
          .ele('cbc:AllowanceChargeReasonCode').txt(p.discount.reasonCode).up()
          .ele('cbc:AllowanceChargeReason').txt(p.discount.reason).up()
          .ele('cbc:MultiplierFactorNumeric').txt(p.discount.precent).up()
          .ele('cbc:Amount', { currencyID: invoice.currencyId }).txt(p.discount.value);
      }
    
      // ✅ ITEM + TAX
      const taxCategory = line.ele('cac:Item')
        .ele('cbc:Name').txt(p.name).up()
        .ele('cac:ClassifiedTaxCategory');
    
      // ✅ TIP (Bacșiș) → zero VAT & exempt reason
      if (p.name === 'Bacsis') {
        taxCategory
          .ele('cbc:ID').txt('Z').up()
          .ele('cbc:Percent').txt('0').up()
          .ele('cac:TaxScheme').ele('cbc:ID').txt('VAT');
    
      // ✅ SGR (garantie ambalaj) → zero VAT & different reason
      } else if (p.name === 'SGR - garantie ambalaj') {
        taxCategory
          .ele('cbc:ID').txt('Z').up()
          .ele('cbc:Percent').txt('0').up()
          .ele('cac:TaxScheme').ele('cbc:ID').txt('VAT');
    
      // ✅ normal taxable products
      } else {
        taxCategory
          .ele('cbc:ID').txt(isVatPayer && p.vatPrecent > 0 ? 'S' : 'Z').up()
          .ele('cbc:Percent').txt(isVatPayer ? p.vatPrecent : 0).up()
          .ele('cac:TaxScheme').ele('cbc:ID').txt('VAT');
      }
    
      // ✅ price BEFORE discount & BEFORE VAT (BT-146)
      line.ele('cac:Price')
        .ele('cbc:PriceAmount', { currencyID: invoice.currencyId }).txt(p.price);
    });
  
    return doc.end({ prettyPrint: true });
  }

  module.exports = {buildEFacturaHeaderXML}