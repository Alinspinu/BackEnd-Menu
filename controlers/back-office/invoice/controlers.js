const axios = require('axios')

const Nir = require('../../../models/office/nir')
const Invoice = require('../../../models/office/invoice')
const Order = require('../../../models/office/product/order')
const Client = require('../../../models/office/client')
const Locatie = require('../../../models/office/locatie')


const {buildEFacturaHeaderXML} = require('./buildXml')
const {createOrderInvoice} = require('./create-order-invoice')
const {downloadZipFile, downloadZipFileCheck} = require('./download-zip')
const {uploadInvoice, checkInvoiceStatus, chageValues} = require('./upload')

    

module.exports.createOrderInvoice = async (req, res) => {
  const {orderId, locId, clientId} = req.body
  try{
    const order = await Order.findById(orderId)
    const loc = await Locatie.findById(locId)
    const client = await Client.findById(clientId)
    const invoice = createOrderInvoice(order, client, loc)
    const newInvoice = new Invoice(invoice)
    const savedInvoice = await newInvoice.save()
    res.status(200).json({message: 'Factura a fost salvată cu succes!!', invoice: savedInvoice})
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
    // console.log(xml)
    const response = await uploadInvoice(xml)
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
    const xml = buildEFacturaHeaderXML(inv, noteDate)
    // console.log(xml);
    const response = await uploadInvoice(xml);
    
    inv.issueDate = noteDate;
    inv.eFacturaId = response.eFacturaId;
    inv.eFacturaStatus = response.eFacturaStatus;
    inv.eFacturaError = response.eFacturaError;

    const newInvoice = new Invoice(inv);
    const savedInvoice = await newInvoice.save();

    res.status(200).json({message: 'Factura de retur a fost încarcată cu success!', invoice: savedInvoice})

  } catch(error){
    console.log(error)
    res.status(500).json(error)
  }
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

module.exports.getInvoicesByClient = async (req, res) => {
  const {id} = req.query
  try{
    const invoices = await Invoice.find({customer: id})
    res.status(200).json(invoices)
  } catch(error){
    console.log(error)
    res.status(200).json(error)
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
  const {id, invoiceId} = req.query 
  try{
    const error = await downloadZipFileCheck(id)

    const invoice = await Invoice.findById(invoiceId)
    invoice.eFacturaError = error.errors
    const updatedInvoice = await invoice.save()
    
    res.status(200).json({message: 'Erorare descată cu success!', invoice: updatedInvoice })
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




// async function transformXmlToPdf(xml, res) {
//   const standard = 'FACT1'; 
//   const novld = 'DA'; 
//   const url = `https://api.anaf.ro/prod/FCTEL/rest/transformare/${standard}/${novld}`;
//   try {
//     const response = await axios.post(url, xml, {
//       headers: {
//         'Content-Type': 'text/plain',
//         'Authorization': `Bearer ${process.env.TOKEN_ANAF}` 
//       },
//       responseType: 'arraybuffer' 
//     });

//     res.set({
//       'Content-Type': 'application/pdf',
//       'Content-Disposition': 'inline; filename=invoice.pdf',
//       'Content-Length': response.data.length
//     });

//     res.send(response.data); // send PDF to browser
//     console.log('✅ PDF sent to frontend.');
//   } catch (error) {
//     console.error('❌ Error transforming XML to PDF:', error.response?.data || error.message);
//     res.status(500).send('Error generating PDF');
//   }
// }



  


