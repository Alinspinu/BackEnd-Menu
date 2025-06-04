const axios = require('axios')

const AdmZip = require('adm-zip');
const xml2js = require('xml2js');
const Nir = require('../../models/office/nir')
const Invoice = require('../../models/office/invoice')
const Order = require('../../models/office/product/order')
const Suplier = require('../../models/office/suplier')
const Locatie = require('../../models/office/locatie')
const {roundd} = require('../../utils/functions')
const {formatDateEFactura} = require('../../utils/functions');


    

function createInvoice(order, customer, supplier) {
  const invoice = {
    serie: 'CAMPUS',
    issueDate: formatDateEFactura(order.updatedAt),
    dueDate: formatDateEFactura(order.updatedAt),
    currencyID: 'RON',
    supplier: {
      name: supplier.bussinessName,
      vatNumber: supplier.vatNumber,
      vat: 'VAT',
      registration: supplier.register,
      legalForm: 'Capital social 200 lei',
      contact: {
        name: 'Alin Spinu',
        email: 'office@truefinecoffee.ro',
        telephone: '0753552492',
      },
      address: {
        street: supplier.address,
        city: 'Iasi',
        country: 'RO'
      }
    },
    client: {
      name: customer.name,
      vatNumber: customer.vatNumber,
      vat: 'VAT',
      registration: customer.registration,
      legalForm: 'Capital social',
      contact: {
        name: '-',
        email: customer.email
      },
      address: {
        street: customer.address,
        city: '-',
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
      let product = {
        name: p.name,
        quantity: p.quantity,
        unitCode: 'XPP',
        price: p.price,
        vatPrecent: p.tva,
        total: +p.total,
        totalNoVat: roundd((p.price * p.quantity) / (1 + (p.tva / 100)))
      }
      if(p.discount > 0){
        product.discount = {};
        product.discount.value = p.discount;
        product.discount.reason = 'Discount Client';
        product.discount.reasonCode = 95;
        product.discount.precent = roundd((p.discount / +p.total) * 100)
        product.totalNoVat = roundd(product.totalNoVat - (p.discount / (1 +(p.tva / 100))))


      }
      return product
    }),
    vatAmount: 0,
    taxExclusiveAmount: 0,
    taxInclusiveAmount: order.total,
    payableAmont: order.total,
    eFacturaId: '',
    eFacturaStatus: '',
    eFacturaError: '',
    customer: customer._id,
    locatie: order.locatie,
    salePoint: order.salePoint
  }

  invoice.taxExclusiveAmount = invoice.products.reduce((sum, p) => {
    return roundd(sum + (p.totalNoVat || 0))
  }, 0)
  invoice.vatAmount = roundd(invoice.taxInclusiveAmount - invoice.taxExclusiveAmount)
  return invoice
}



module.exports.createOrderInvoice = async (req, res) => {
  const {orderId, locId, clientId} = req.body
  try{
    const order = await Order.findById(orderId)
    const loc = await Locatie.findById(locId)
    const client = await Suplier.findById(clientId)
    const invoice = createInvoice(order, client, loc)
    res.status(200).json(invoice)
  } catch(error) {
    console.log(error)
    res.status(500).json(error)
  }
}






module.exports.getMessages = async (req, res) => {
    const {days, cif} = req.query
    const config = {
        headers: {
          'Authorization': `Bearer ${process.env.TOKEN_ANAF}`,
          'Content-Type': 'application/json',  // Optional: Set content type if needed
        }
      }

    try{
    const response = await axios.get(`${process.env.ANAF_DAYS_BASE_API_URL}?zile=${days}&cif=${cif}&filtru=P`, config)
    if(response){
        res.status(200).json(response.data)
    }

    }catch(error){
        console.log(error)
        res.status(500).json(error)
    }
}

    module.exports.getMessagesByDate = async (req, res) => {
      const {startDate, endDate, cif} = req.body
      let page = 1
      const apiUrl1 = `https://api.anaf.ro/prod/FCTEL/rest/listaMesajePaginatieFactura?startTime=${startDate}&endTime=${endDate}&cif=${cif}&pagina=${page}`
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
    const {ids} = req.body;

    try{
      const nirs = await Nir.find({eFacturaId:{$in: ids}})
      const nirsIds = nirs.map(n => n.eFacturaId)
      res.status(200).json(nirsIds)
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
            try {
                const result = await parseXml(xmlData); 
                console.log(xmlData)
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
  //  const customer = {
  //   name: Array.isArray(invoiceData.Invoice["cac:AccountingCustomerParty"]) && 
  //           Array.isArray(invoiceData.Invoice["cac:AccountingCustomerParty"][0]["cac:Party"]) && 
  //           Array.isArray(invoiceData.Invoice["cac:AccountingCustomerParty"][0]["cac:Party"][0]["cac:PartyLegalEntity"]) 
  //       ? (invoiceData.Invoice["cac:AccountingCustomerParty"][0]["cac:Party"][0]["cac:PartyLegalEntity"][0]["cbc:RegistrationName"][0]["_"] || 
  //       invoiceData.Invoice["cac:AccountingCustomerParty"][0]["cac:Party"][0]["cac:PartyLegalEntity"][0]["cbc:RegistrationName"][0]) 
  //       : 'Unknown Customer',
  //   vatNumber: Array.isArray(invoiceData.Invoice["cac:AccountingCustomerParty"]) && 
  //               Array.isArray(invoiceData.Invoice["cac:AccountingCustomerParty"][0]["cac:Party"]) && 
  //               Array.isArray(invoiceData.Invoice["cac:AccountingCustomerParty"][0]["cac:Party"][0]["cac:PartyTaxScheme"]) 
  //       ? (invoiceData.Invoice["cac:AccountingCustomerParty"][0]["cac:Party"][0]["cac:PartyTaxScheme"][0]["cbc:CompanyID"][0]["_"] || 
  //       invoiceData.Invoice["cac:AccountingCustomerParty"][0]["cac:Party"][0]["cac:PartyTaxScheme"][0]["cbc:CompanyID"][0]) 
  //       : 'Unknown VAT Number'
  //   };
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

