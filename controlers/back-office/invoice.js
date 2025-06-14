const axios = require('axios')

const AdmZip = require('adm-zip');
const xml2js = require('xml2js');
const Nir = require('../../models/office/nir')
const Invoice = require('../../models/office/invoice')
const Order = require('../../models/office/product/order')
const Client = require('../../models/office/client')
const Locatie = require('../../models/office/locatie')
const {round} = require('../../utils/functions')
const {formatDateEFactura} = require('../../utils/functions');
const { create } = require('xmlbuilder2');
const { parseStringPromise } = require('xml2js');


    





module.exports.createOrderInvoice = async (req, res) => {
  const {orderId, locId, clientId} = req.body
  try{
    const order = await Order.findById(orderId)
    const loc = await Locatie.findById(locId)
    const client = await Client.findById(clientId)
    const invoice = createInvoice(order, client, loc)
    const newInvoice = new Invoice(invoice)
    console.log(newInvoice)
    const savedInvoice = await newInvoice.save()
    res.status(200).json(savedInvoice)
  } catch(error) {
    console.log(error)
    res.status(500).json(error)
  }
}


module.exports.saveInvoice = async (req, res) => {
  const {invoice} = req.body
  try{
    const newInvoice = new Invoice(invoice)
    const savedInvoice = await newInvoice.save()
    res.status(200).json({message: 'Factura a fost savată cu succes!', invoice: savedInvoice})
  } catch(error) {
    console.log(error)
    res.status(500).json(error)
  }
}


module.exports.uploadInvoiceToEFactura = async (req, res) => {
  const {id} = req.body
  try{
    const invoice = await Invoice.findById(id)
    const xml = invoice.invoice ? buildEFacturaHeaderXML(invoice) : buildEFacturaHeaderXML(invoice, invoice.issueDate)
    console.log(xml)
    const response = await testInvoice(xml)
    invoice.eFacturaId = response.eFacturaId
    invoice.eFacturaError = response.eFacturaError
    invoice.eFacturaStatus = response.eFacturaStatus
    const savedInvoice = await invoice.save()
    res.status(200).json({message: response.message, invoice: savedInvoice})
  } catch(error){
    console.log(error)
    res.status(500).json(error)
  }
}


module.exports.uploadCreditNoteToEFactura = async (req, res) => {
  const {id, noteDate} = req.body
  try{
    let invoice = await Invoice.findById(id).lean();
    const {
      _id, __v, eFacturaId, eFacturaStatus, eFacturaError, ...invoiceData
    } = invoice;


    const inv = await chageValues(invoiceData)
    // Generate XML credit note
    const xml = buildEFacturaHeaderXML(inv, noteDate)
    
    console.log(xml);
    
    const response = await testInvoice(xml);
    
    inv.issueDate = noteDate;
    inv.eFacturaId = response.eFacturaId;
    inv.eFacturaStatus = response.eFacturaStatus;
    inv.eFacturaError = response.eFacturaError;
    


    const newInvoice = new Invoice(inv);
    const savedInvoice = await newInvoice.save();
    res.status(200).json({message: 'success', invoice: savedInvoice})

  } catch(error){
    console.log(error)
    res.status(500).json(error)
  }
}


 async function chageValues(invoice){
  invoice.creditNoteRef = invoice.invoiceNumber
  invoice.invoiceNumber = invoice.invoiceNumber + " S"
  invoice.invoice = false;
  invoice.products.forEach(p => {
    p.totalNoVat = -Math.abs(p.totalNoVat)
    p.total = -Math.abs(p.total)
    p.quantity = -Math.abs(p.quantity)
    if(p.discount && p.discount.value > 0){
      p.discount.value = -Math.abs(p.discount.value)
    }
  })

  invoice.vatGroups.forEach(v => {
    v.tax = -Math.abs(v.tax)
    v.taxable = -Math.abs(v.taxable)
  })

  if(invoice.discount.length){
    invoice.discount.forEach(d => {
      d.value = -Math.abs(d.value)
      d.baseAmount = -Math.abs(d.baseAmount)
    })
  }
  invoice.vatAmount = -Math.abs(invoice.vatAmount)
  invoice.taxExclusiveAmount = -Math.abs(invoice.taxExclusiveAmount)
  invoice.taxInclusiveAmount = -Math.abs(invoice.taxInclusiveAmount)
  invoice.payableAmount = -Math.abs(invoice.payableAmount)

  return invoice
}


module.exports.getInvoices = async (req, res) => {
  const {loc} = req.query
  try{
    const invoices = await Invoice.find({locatie: loc})
    res.status(200).json(invoices)
  } catch(error) {
    res.status(500).json(error)
    console.log(error)
  }
}


module.exports.editInvoice = async (req, res) => {
  const {invoice} = req.body
  try{
    const newInvoice = await Invoice.findByIdAndUpdate(invoice._id, invoice, {new: true})
    res.status(200).json({message: 'Factura a fost editată cu success!', invoice: newInvoice})
  } catch(error) {
    console.log(error)
    res.status(500).json(error) 
  }

}

module.exports.deleteInvoice = async (req, res) => {
  const {id} = req.query
  try{
    await Invoice.findByIdAndDelete(id)
    res.status(200).json({message: 'Factura a fost ștearsă cu success!'})
  } catch(error){
    console.log(error)
    res.status(500).json(error)
  }
}


module.exports.checkInvoiceUploadStatus = async (req, res) => {
  const {id} = req.query     
  try{
    const invoice = await Invoice.findById(id)
    if(invoice && invoice.eFacturaId){
      const response = await checkInvoiceStatus(invoice.eFacturaId)
      invoice.eFacturaId = response.eFacturaId
      invoice.eFacturaError = response.eFacturaError
      invoice.eFacturaStatus = response.eFacturaStatus
      const savedInvoice = await invoice.save()
      res.status(200).json({message: response.message, invoice: savedInvoice})
    } else {
      res.status(200).josn({message: 'Factura nu a fost găsită', invoice: null})
    }
  }catch(error){
      console.log(error)
      res.status(500).json(error)
  }
}

module.exports.handleUplodErros = async (req, res) => {
  const {id} = req.query 
  try{
    const files = await downloadZipFileCheck(id)
    if(files.length){
      files.forEach(f => {
        // console.log(`📄 File: ${f.name}`);
        // console.log(f.content);
      })
    } else {
      // console.log(files)
    }
    res.status(200).json({message: 'ok'})
  } catch(error){
    console.log(error)
    res.status(500).json(error)
  }
}


module.exports.getMessages = async (req, res) => {
    const {days, cif, filter = 'P'} = req.query
    const config = {
        headers: {
          'Authorization': `Bearer ${process.env.TOKEN_ANAF}`,
          'Content-Type': 'application/json', 
        }
      }

    try{
    const response = await axios.get(`${process.env.ANAF_DAYS_BASE_API_URL}?zile=${days}&cif=${cif}&filtru=${filter}`, config)
    if(response){
        res.status(200).json(response.data)
    }

    }catch(error){
        console.log(error)
        res.status(500).json(error)
    }
}

    module.exports.getMessagesByDate = async (req, res) => {
      const {startDate, endDate, cif, filter = 'P'} = req.body
      let page = 1
      const apiUrl1 = `https://api.anaf.ro/prod/FCTEL/rest/listaMesajePaginatieFactura?startTime=${startDate}&endTime=${endDate}&cif=${cif}&pagina=${page}&filtru${filter}`
      const config = {
        headers: {
          'Authorization': `Bearer ${process.env.TOKEN_ANAF}`,
          'Content-Type': 'application/json',
        }
      }

    try{
    const response = await axios.get(apiUrl1, config)
    if(response){
        const allPages = response.data.numar_total_pagini
        console.log(allPages)
        let messages = response.data.mesaje
        if(allPages === page){
          res.status(200).json(response.data)
        }
        if(allPages > page){
          const diference = allPages - page
          for(let i=1; i <= diference; i++){
             page = i+1
             console.log('page', page)
             const resp = await axios.get(apiUrl1, config)
             messages = [...messages, ...resp.data.mesaje]
          }
        response.data.mesaje = messages
        res.status(200).json(response.data)
        }
    }
    }catch(error){
        console.log(error)
        res.status(500).json(error)
    }
}



module.exports.getInvoice = async (req, res) => {
    const {id} = req.query;
    try{
        const invoice = await downloadZipFile(id)
        console.log(invoice)
        res.status(200).json(invoice)
    } catch(err) {
        console.log(err)
        res.status(500).josn(err)
    }
}



  module.exports.checkInvoceStatus = async (req, res) => {
    const {ids, upload} = req.body;
    try{
      if(upload){
        const bills = await Invoice.find({eFacturaId:{$in: ids}})
        const billsIds = bills.map(b => b.eFacturaId)
        res.status(200).json(billsIds)
      } else {
        const nirs = await Nir.find({eFacturaId:{$in: ids}})
        const nirsIds = nirs.map(n => n.eFacturaId)
        res.status(200).json(nirsIds)
      }
    } catch(error) {
      console.log(error)
      rse.status(500).json(error)
    }

  }


  async function downloadZipFile(id) {
    try {
      const response = await axios.get(`${process.env.ANAF_DOWNLOAD_BASE_URL}?id=${id}`, {
        responseType: 'arraybuffer',
        headers: {
          'Authorization': `Bearer ${process.env.TOKEN_ANAF}`, 
          'Accept': 'application/zip',
        },
      });

      // console.log('anaf response', response)

        const zip = new AdmZip(response.data);
        const zipEntries = zip.getEntries(); 
        let invoice;
    
        for (const entry of zipEntries) {
            if (!entry.entryName.includes('semnatura')) {
            const xmlData = entry.getData().toString('utf8'); 
            console.log(xmlData)
            try {
                const result = await parseXml(xmlData); 
                invoice = parseInvoiceData(result, id);
                break; 
            } catch (err) {
                console.error(`Error parsing XML:`, err);
            }
            }
        }
    
        return invoice;
     
  
    } catch (error) {
      console.error('Error downloading or processing the ZIP file:', error);
    }
  }





async function downloadZipFileCheck(id) {
  try {
    const response = await axios.get(`https://api.anaf.ro/test/FCTEL/rest/descarcare?id=${id}`, {
      responseType: 'arraybuffer',
      headers: {
        'Authorization': `Bearer ${process.env.TOKEN_ANAF}`,
        'Accept': 'application/zip',
      },
    });

    const buffer = Buffer.from(response.data);

    // ✅ Check if buffer is a ZIP (should start with "PK" == 0x50 0x4B)
    if (buffer[0] === 0x50 && buffer[1] === 0x4B) {
      const zip = new AdmZip(buffer);
      const files = zip.getEntries().map(entry => ({
        fileName: entry.entryName,
        content: entry.getData().toString('utf8'),
      }));
      let header

      console.log(files)

      files.forEach(async f =>{
        if(!f.fileName.includes('semnatura')){
            header = await parseHeaderFromXml(f.content)
          //  console.log(f.content)
           console.log(header)
        }
      })


      return { type: 'zip', files };
    } else {
      // ❌ Not a ZIP – try parsing as JSON error
      const text = buffer.toString('utf8');
      try {
        const error = JSON.parse(text);
        return { type: 'error', message: error.eroare || text };
      } catch (e) {
        return { type: 'error', message: `Unexpected response: ${text.slice(0, 300)}...` };
      }
    }
  } catch (err) {
    console.error('Download failed:', err.message);
    throw new Error('Download or processing failed');
  }
}





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

  const getText = (val) => {
    if (typeof val === 'string') return val;
    if (typeof val === 'object' && '_' in val) return val._;
    return val?.toString?.() || 'Unknown';
  };
  


  const parseInvoiceData = (invoiceData, id) => {
    console.log(invoiceData.Invoice["cac:AllowanceCharge"])
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
        : 'Unknown VAT Number'
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
      
        // Extract quantity and unit code
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


/// CREATE INVOICE

function createInvoice(order, customer, supplier) {
  const invoice = {
    serie: 'CAMPUS',
    issueDate: formatDateEFactura(order.updatedAt),
    dueDate: formatDateEFactura(order.updatedAt),
    currencyId: 'RON',
    supplier: {
      name: supplier.bussinessName,
      vatNumber: supplier.vatNumber,
      vat: supplier.VAT,
      registration: supplier.register,
      legalForm: 'Capital social 200 lei',
      contact: {
        name: supplier.contactName,
        email: supplier.email,
        telephone: supplier.telephone,
      },
      address: {
        street: supplier.invoiceAddress.street,
        city: supplier.invoiceAddress.city,
        postalCode: supplier.invoiceAddress.postalCode,
        coutrySubentity: supplier.invoiceAddress.coutrySubentity,
        country: 'RO'
      }
    },
    client: {
      name: customer.name,
      vatNumber: customer.vatNumber,
      vat: customer.vat,
      registration: customer.register,
      legalForm: 'Capital social',
      contact: {
        name: '-',
        email: customer.email
      },
      address: {
        street: customer.invoiceAddress.street,
        city: customer.invoiceAddress.city,
        postalCode: customer.invoiceAddress.postalCode,
        coutrySubentity: customer.invoiceAddress.coutrySubentity,
        country: 'RO'
      },
    },
    paymentMeans: {
      code: 42,
      name: `CONT BANCA ${supplier.bank} IN LEI`,
      iban: supplier.account,
      swift: supplier.switf
    },
    products: order.products.map(p => {
      const price = p.price;
      const vatRate = 1 + (p.tva / 100);
      const priceNoVat = round(price / vatRate);
      let product = {
        name: p.name,
        quantity: p.quantity,
        unitCode: 'H87',
        price: priceNoVat,
        vatPrecent: p.tva,
        total: +p.total-p.discount, 
        totalNoVat: round(priceNoVat * p.quantity)
      };
      if(p.discount > 0){
        const discount = p.discount;
        const discountNoVat = round(discount / vatRate);
        product.discount = {};
        product.discount.value = discountNoVat;
        product.discount.reason = 'Discount Client';
        product.discount.reasonCode = 95;
        product.discount.precent = round((discount / +p.total) * 100)
        product.totalNoVat = round(product.totalNoVat - discountNoVat)
      }
      return product
    }),
    vatAmount: 0,
    vatGroups: [],
    taxExclusiveAmount: 0,
    taxInclusiveAmount: order.total,
    payableAmount: order.total,
    eFacturaId: '',
    eFacturaStatus: '',
    eFacturaError: '',
    customer: customer._id,
    locatie: order.locatie,
    salePoint: order.salePoint
  }






  invoice.taxExclusiveAmount = invoice.products.reduce((sum, p) => {
    const existingRate = invoice.vatGroups.find(r => r.rate === p.vatPrecent)
    if(existingRate){
      existingRate.taxable += p.totalNoVat
      existingRate.tax += p.total
    } else {
      invoice.vatGroups.push({rate: p.vatPrecent, tax: p.total, taxable: p.totalNoVat})
    }
    return sum + (p.totalNoVat || 0)
  }, 0)

  invoice.taxExclusiveAmount = round(invoice.taxExclusiveAmount)

  invoice.vatGroups.forEach(v => {
    v.tax = round(v.tax - v.taxable)
    v.taxable = round(v.taxable)
  })
  
  invoice.vatAmount = round(invoice.taxInclusiveAmount - invoice.taxExclusiveAmount)
  return invoice
}





function buildEFacturaHeaderXML(invoice, date) {
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
      doc.ele('cbc:InvoiceTypeCode').txt('380').up(); // standard invoice
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
  supplierParty.ele('cac:PartyTaxScheme')
    .ele('cbc:CompanyID').txt(invoice.supplier.vatNumber).up()
    .ele('cac:TaxScheme').ele('cbc:ID').txt(invoice.supplier.vat ? 'VAT' : 'NO').up().up().up();
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
  customerParty.ele('cac:PartyTaxScheme')
    .ele('cbc:CompanyID').txt(invoice.client.vatNumber).up()
    .ele('cac:TaxScheme').ele('cbc:ID').txt('VAT').up().up().up();
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


  const taxTotal = doc.ele('cac:TaxTotal');
  taxTotal.ele('cbc:TaxAmount', { currencyID: invoice.currencyId }).txt(invoice.vatAmount).up();

  // Add one <cac:TaxSubtotal> per VAT rate

  invoice.vatGroups.forEach(r => {
    const subtotal = taxTotal.ele('cac:TaxSubtotal');
    subtotal.ele('cbc:TaxableAmount', { currencyID: invoice.currencyId }).txt(r.taxable).up();
    subtotal.ele('cbc:TaxAmount', { currencyID: invoice.currencyId }).txt(r.tax).up();
    subtotal.ele('cac:TaxCategory')
      .ele('cbc:ID').txt('S').up()
      .ele('cbc:Percent').txt(r.rate).up()
      .ele('cac:TaxScheme').ele('cbc:ID').txt('VAT').up().up().up();
  })
  

  // LegalMonetaryTotal
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

    if (p.discount && p.discount.value > 0) {
      console.log(p.discount)
      line.ele('cac:AllowanceCharge')
        .ele('cbc:ChargeIndicator').txt('false').up()
        .ele('cbc:AllowanceChargeReasonCode').txt(p.discount.reasonCode).up()
        .ele('cbc:AllowanceChargeReason').txt(p.discount.reason).up()
        .ele('cbc:MultiplierFactorNumeric').txt(p.discount.precent).up()
        .ele('cbc:Amount', { currencyID: invoice.currencyId }).txt(p.discount.value);
    }
    // <cbc:MultiplierFactorNumeric>40.00</cbc:MultiplierFactorNumeric><!--BT-94-->
    line.ele('cac:Item')
      .ele('cbc:Name').txt(p.name).up()
      .ele('cac:ClassifiedTaxCategory')
        .ele('cbc:ID').txt('S').up()
        .ele('cbc:Percent').txt(p.vatPrecent).up()
        .ele('cac:TaxScheme').ele('cbc:ID').txt('VAT');

    line.ele('cac:Price')
      .ele('cbc:PriceAmount', { currencyID: invoice.currencyId }).txt(p.price);
  });

  return doc.end({ prettyPrint: true });
}





async function transformXmlToPdf(xml, res) {
  const standard = 'FACT1'; 
  const novld = 'DA'; 
  const url = `https://api.anaf.ro/prod/FCTEL/rest/transformare/${standard}/${novld}`;
  try {
    const response = await axios.post(url, xml, {
      headers: {
        'Content-Type': 'text/plain',
        'Authorization': `Bearer ${process.env.TOKEN_ANAF}` 
      },
      responseType: 'arraybuffer' 
    });

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'inline; filename=invoice.pdf',
      'Content-Length': response.data.length
    });

    res.send(response.data); // send PDF to browser
    console.log('✅ PDF sent to frontend.');
  } catch (error) {
    console.error('❌ Error transforming XML to PDF:', error.response?.data || error.message);
    res.status(500).send('Error generating PDF');
  }
}



  async function testInvoice(xml, cn = false) {
    const token = process.env.TOKEN_ANAF;
    const standard = cn ? 'CN' : 'UBL';
    const cif = '44994432';
    const veryfyBaseUrl = 'https://api.anaf.ro/test/FCTEL/rest/stareMesaj';
    const baseUrl = 'https://api.anaf.ro/test/FCTEL/rest/upload';
    const url = `${baseUrl}?standard=${standard}&cif=${cif}`;
  
    try {
      const response = await axios.post(url, xml, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/xml',
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity
      });
  
      const header = await parseHeaderFromXml(response.data);
      const indexIncarcare = header.$.index_incarcare;
      const error = header.Errors?.$?.errorMessage;
  
      if (indexIncarcare) {
        return checkInvoiceStatus(indexIncarcare, token)
      }
      if (error) {
        return {
            message: error,
            eFacturaError: error,
            eFacturaStatus: 'eroare incarcare',
            eFacturaId: ''
          }
      }
    } catch (err) {
      console.error('Error uploading:', err?.response?.data || err.message);
      throw err
    }
  }


  async function checkInvoiceStatus(indexIncarcare) {
    const token = process.env.TOKEN_ANAF;
    const veryfyBaseUrl = 'https://api.anaf.ro/test/FCTEL/rest/stareMesaj';
    const verifyUrl = `${veryfyBaseUrl}?id_incarcare=${indexIncarcare}`;
    try{
      const resp = await axios.get(verifyUrl, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/xml',
        },
        responseType: 'text',
        maxContentLength: Infinity,
        maxBodyLength: Infinity
      });
      console.log(resp.data)
      const head = await parseHeaderFromXml(resp.data);
      const eFacturaStatus = head.$.stare;
      const downloadId = head.$.id_descarcare
      return {
          eFacturaStatus: eFacturaStatus,
          eFacturaId: downloadId ? downloadId : indexIncarcare,
          eFacturaError: '',
          message: 'Fișierul a fost încărcat cu success!'
        }
    } catch(error) {
      console.error('Error uploading:', err?.response?.data || err.message);
      throw error
    }
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
