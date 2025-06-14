const axios = require('axios')
const {parseHeaderFromXml} = require('./parseXml')


async function uploadInvoice(xml, cn = false) {
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


  module.exports = {uploadInvoice, checkInvoiceStatus, chageValues}