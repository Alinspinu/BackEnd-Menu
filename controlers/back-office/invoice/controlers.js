const axios = require('axios')

const Nir = require('../../../models/office/nir')
const Invoice = require('../../../models/office/invoice')
const Order = require('../../../models/office/product/order')
const Client = require('../../../models/office/client')
const Locatie = require('../../../models/office/locatie')

const io = require('socket.io-client')
const socket = io('https://flowmanager.ro', {
      path: '/socket.io/',
      transports: ['websocket']
    })


const {buildEFacturaHeaderXML} = require('./buildXml')
const {createOrderInvoice} = require('./create-order-invoice')
const {downloadZipFile, downloadZipFileCheck} = require('./download-zip')
const {uploadInvoice, checkInvoiceStatus, chageValues} = require('./upload')

    

module.exports.createOrderInvoice = async (req, res) => {
  const {orderId, locId, clientId, unload} = req.body
  try{
    const order = await Order.findById(orderId)
    const loc = await Locatie.findById(locId)
    const client = await Client.findById(clientId)

    const invoice = createOrderInvoice(order, client, loc, unload)

    const newInvoice = new Invoice(invoice)
    const savedInvoice = await newInvoice.save()
    if(unload){
      order.status = 'done'
      order.invoice = true

      const so = await Order.findByIdAndUpdate(order._id, order, {new: true})
      socket.emit('billl', JSON.stringify({bill: so}))
    }

    res.status(200).json({message: 'Factura a fost salvată cu succes!!', invoice: savedInvoice})
  } catch(error) {
    console.log(error)
    res.status(500).json(error)
  }
}


module.exports.saveInvoice = async (req, res) => {
  const {invoice} = req.body
  try{
    invoice.unload = true
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
    const locatie = await Locatie.findById(invoice.locatie).populate({path: 'anafToken', select: 'token'})
    const token = locatie.anafToken.token
    if(!token){
      return res.status(404).json({message: 'Missing token'})
    }
    const xml = invoice.invoice ? buildEFacturaHeaderXML(invoice) : buildEFacturaHeaderXML(invoice, invoice.issueDate)
    let vatNumber = invoice.supplier.vatNumber.replace(/\D/g, '');
    const response = await uploadInvoice(xml, vatNumber, false, token)
    invoice.eFacturaId = response.eFacturaId
    invoice.eFacturaError = response.eFacturaError
    invoice.eFacturaStatus = response.eFacturaStatus
    const savedInvoice = await Invoice.findByIdAndUpdate(id, invoice, {new: true})
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
    const locatie = await Locatie.findById(invoice.locatie).populate({path: 'anafToken', select: 'token'})
    const token = locatie.anafToken.token
    if(!token){
      return res.status(404).json({message: 'Missing token'})
    }
    const {
      _id, __v, eFacturaId, eFacturaStatus, eFacturaError, ...invoiceData
    } = invoice;

    const inv = await chageValues(invoiceData)
    const xml = buildEFacturaHeaderXML(inv, noteDate)
    let vatNumber = invoiceData.supplier.vatNumber.replace(/\D/g, '');
    const response = await uploadInvoice(xml, vatNumber, false, token);
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

    // for(let i of invoices){
    //     await Invoice.findByIdAndUpdate(i._id, i)
    // }
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
      const locatie = await Locatie.findById(invoice.locatie).populate({path: 'anafToken', select: 'token'})
      const token = locatie.anafToken.token
      if(!token){
        return res.status(404).json({message: 'Missing token'})
      }
      const response = await checkInvoiceStatus(invoice.eFacturaId,false, token)
      invoice.eFacturaId = response.eFacturaId
      invoice.eFacturaError = response.eFacturaError
      invoice.eFacturaStatus = response.eFacturaStatus
      const savedInvoice = await Invoice.findByIdAndUpdate(id, invoice, {new: true})
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
    const invoice = await Invoice.findById(invoiceId)
    const locatie = await Locatie.findById(invoice.locatie).populate({path: 'anafToken', select: 'token'})
    const token = locatie.anafToken.token
    if(!token){
      return res.status(404).json({message: 'Missing token'})
    }
    const error = await downloadZipFileCheck(id, token)
    invoice.eFacturaError = error.errors
    const updatedInvoice = await Invoice.findByIdAndUpdate(invoiceId, invoice, {new: true})
    
    res.status(200).json({message: 'Erorare descată cu success!', invoice: updatedInvoice })
  } catch(error){
    console.log(error)
    res.status(500).json(error)
  }
}


module.exports.getMessages = async (req, res) => {
    const {days, filter = 'P', loc} = req.query
    try{
    const locatie = await Locatie.findById(loc).populate({path: 'anafToken', select: 'token'})
    if(locatie){
      if(locatie.anafToken && locatie.anafToken.token){
        const cif = locatie.vatNumber.replace(/\D/g, '')
        const config = {
            headers: {
              'Authorization': `Bearer ${locatie.anafToken.token}`,
              'Content-Type': 'application/json',  
            }
          }
          // const baseUrl = 'https://api.anaf.ro/test/FCTEL/rest/listaMesajeFactura'
          const baseUrl = process.env.ANAF_DAYS_BASE_API_URL
        const response = await axios.get(`${baseUrl}?zile=${days}&cif=${cif}&filtru=${filter}`, config)
        if(response){
            res.status(200).json(response.data)
        }
      } else {
        res.status(404).json({message: 'Missing token'})
      }
    } else {
      res.status(404).json({message: 'Mising locatie'})
    }
    }catch(error){
        console.log(error)
        res.status(500).json(error)
    }
}

module.exports.getMessagesByDate = async (req, res) => {
  const {startDate, endDate, filter = 'P', loc} = req.body
  try{
    const locatie = await Locatie.findById(loc).populate({path: 'anafToken', select: 'token'})
    if(locatie){
      if(locatie.anafToken && locatie.anafToken.token){
        const cif = locatie.vatNumber.replace(/\D/g, '')
        let page = 2
        const apiUrl1 = `https://api.anaf.ro/prod/FCTEL/rest/listaMesajePaginatieFactura?startTime=${startDate}&endTime=${endDate}&cif=${cif}&pagina=${page}&filtru${filter}`
        const config = {
          headers: {
            'Authorization': `Bearer ${locatie.anafToken.token}`,
            'Content-Type': 'application/json',
          }
        }
      
        const response = await axios.get(apiUrl1, config)
        console.log(response.data)
        if(response){
            const allPages = response.data.numar_total_pagini
            page = response.data.index_pagina_curenta
            let messages = response.data.mesaje
            if(allPages === page){
              res.status(200).json(response.data)
            }
            if(allPages > page){
              const diference = allPages - page
              for(let i=1; i <= diference; i++){
                  const resp = await axios.get(apiUrl1, config)
                  page = resp.data.index_pagina_curenta
                  messages = [...messages, ...resp.data.mesaje]
              }
            response.data.mesaje = messages
            res.status(200).json(response.data)
            }
        }
      } else {
        res.status(404).json({message: 'Missing token'})
      }
    }  else {
      res.status(404).json({message: 'Mising locatie'})
    }
  }catch(error){
      console.log(error)
      res.status(500).json(error)
  }
}

module.exports.getInvoice = async (req, res) => {
    const {id, loc} = req.query;
    try{
      const locatie = await Locatie.findById(loc).populate({path: 'anafToken', select: 'token'})
      const token = locatie.anafToken.token
      if(!token){
        return res.status(404).json({message: 'Missing token'})
      }
        const data = await downloadZipFile(id, token)
        if (data.error) {
          return res.status(500).json({ message: data.error });
        } 
        if(data.invoice){
          res.status(200).json(data.invoice)
        }
        if(!data){
          return res.status(500).json({ message: 'Documentul nu a putut fi descarcat' });
        }
    } catch(err) {
        console.log(err)
        res.status(500).json(err)
    }
}



  module.exports.checkInvoceStatus = async (req, res) => {
    const {ids, upload, loc} = req.body;
    try{
      if(upload){
        const bills = await Invoice.find({eFacturaId:{$in: ids}, locatie: loc})
        const billsIds = bills.map(b => b.eFacturaId)
        res.status(200).json(billsIds)
      } else {
        const nirs = await Nir.find({eFacturaId:{$in: ids}, locatie: loc})
        const nirsIds = nirs.map(n => n.eFacturaId)
        res.status(200).json(nirsIds)
      }
    } catch(error) {
      console.log(error)
      rse.status(500).json(error)
    }

  }




  


