const axios = require('axios')
const https = require('https');
const fs = require('fs')

const AdmZip = require('adm-zip');
const xml2js = require('xml2js');



const startDate = new Date('2024-11-10').getTime()
const endDate = new Date('2024-11-16').getTime()

const baseApiDaysUrl = 'https://api.anaf.ro/prod/FCTEL/rest/listaMesajeFactura ?zile= 10&cif=44994432'

const apiUrl1 = `https://api.anaf.ro/prod/FCTEL/rest/listaMesajePaginatieFactura?startTime=${startDate}&endTime=${endDate}&cif=44994432&pagina=1`


                 






module.exports.getMessages = async (req, res) => {
    const {days, cif} =req.query
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
        console.log(response.data)
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
        res.status(200).json(invoice)
    } catch(err) {
        console.log(err)
        res.status(500).josn(err)
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
  
      const zip = new AdmZip(response.data);
      const zipEntries = zip.getEntries(); 
      let invoice;
  
      for (const entry of zipEntries) {
        if (!entry.entryName.includes('semnatura')) {
          const xmlData = entry.getData().toString('utf8'); 
          try {
            const result = await parseXml(xmlData); 
            invoice = parseInvoiceData(result);
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


  const parseInvoiceData = (invoiceData) => {
    const invoiceSummary = {
        invoiceNumber: invoiceData.Invoice["cbc:ID"][0], // Invoice ID
        issueDate: invoiceData.Invoice["cbc:IssueDate"][0], // Issue Date
        dueDate: invoiceData.Invoice["cbc:DueDate"] ? invoiceData.Invoice["cbc:DueDate"][0] : invoiceData.Invoice["cbc:IssueDate"][0], 
        supplier: {
          name: invoiceData.Invoice["cac:AccountingSupplierParty"][0]["cac:Party"][0]["cac:PartyLegalEntity"][0]["cbc:RegistrationName"][0], // Supplier Name
          vatNumber: invoiceData.Invoice["cac:AccountingSupplierParty"][0]["cac:Party"][0]["cac:PartyTaxScheme"][0]["cbc:CompanyID"][0], // Supplier VAT
        },
        customer: {
          name: invoiceData.Invoice["cac:AccountingCustomerParty"][0]["cac:Party"][0]["cac:PartyLegalEntity"][0]["cbc:RegistrationName"][0], // Customer Name
          vatNumber: invoiceData.Invoice["cac:AccountingCustomerParty"][0]["cac:Party"][0]["cac:PartyTaxScheme"][0]["cbc:CompanyID"][0], // Customer VAT
        },
        products: invoiceData.Invoice["cac:InvoiceLine"].map(item => ({
          name: item["cac:Item"][0]["cbc:Name"][0], // Product Name
          quantity: +item["cbc:InvoicedQuantity"][0]["_"], // Quantity
          price: +item["cac:Price"][0]["cbc:PriceAmount"][0]["_"], // Price per unit
          totalNoVat: +item["cbc:LineExtensionAmount"][0]["_"], // Line total
          vatPrecent: +item["cac:Item"][0]["cac:ClassifiedTaxCategory"][0]["cbc:Percent"][0]
        })),
        vatAmount: +invoiceData.Invoice["cac:TaxTotal"][0]["cbc:TaxAmount"][0]["_"], // VAT amount
        taxExclusiveAmount: +invoiceData.Invoice["cac:LegalMonetaryTotal"][0]["cbc:TaxExclusiveAmount"][0]["_"],
        taxInclusiveAmount: +invoiceData.Invoice["cac:LegalMonetaryTotal"][0]["cbc:TaxInclusiveAmount"][0]["_"],
        prePaydAmount: +invoiceData.Invoice["cac:LegalMonetaryTotal"][0]["cbc:PrepaidAmount"] ? invoiceData.Invoice["cac:LegalMonetaryTotal"][0]["cbc:PrepaidAmount"][0]["_"] : 0,
        payableAmont: +invoiceData.Invoice["cac:LegalMonetaryTotal"][0]["cbc:PayableAmount"][0]["_"], // Total amount (Payable)
      };
      console.log(invoiceSummary)
      return invoiceSummary
};


// async function downloadZipFile() {
//     try {
//     //   const response = await axios.get(downloadApi, {
//     //     responseType: 'arraybuffer', // Treat the response as binary data
//     //     headers: {
//     //       'Authorization': `Bearer ${token}`, // Optional if you have a token
//     //        'Accept': 'application/zip'
//     //     },
//     //   });
  
//     //
//     //   const filePath = './downloaded_file.zip';
//     //   fs.writeFileSync(filePath, response.data);
//       const outputDir = './unzipped_files';

//     //   const zip = new AdmZip(filePath);
//     //   zip.extractAllTo(outputDir, true);
      
      
//       const xmlFiles = fs.readdirSync(outputDir).filter(file => !file.includes('semnatura'));

//       xmlFiles.forEach(file => {
//         const xmlData = fs.readFileSync(`${outputDir}/${file}`, 'utf8');

        
//         xml2js.parseString(xmlData, (err, result) => {
//             if (err) {
//                 console.error(`Error parsing XML in file ${file}:`, err);
//                 return;
//             }
          
            
//               parseInvoiceData(result)
//             //   console.log(result)
//           console.log(`Parsed XML from ${file}:`);
//         //   console.log(result)
//         //   console.log(JSON.stringify(result)); 
//         });
//       });
  
//     } catch (error) {
//         console.log(error)
//     }
//   }


// async function downloadZipFile(id) {
//     try {
//       const response = await axios.get(`${process.env.ANAF_DOWNLOAD_BASE_URL}?id=${id}`, {
//         responseType: 'arraybuffer', // Treat the response as binary data
//         headers: {
//           'Authorization': `Bearer ${preocess.env.TOKEN_ANAF}`, 
//           'Accept': 'application/zip',
//         },
//       });
//       const zip = new AdmZip(response.data);
//       const zipEntries = zip.getEntries(); 
//       let invoice
//       zipEntries.forEach(entry => {
//         if (!entry.entryName.includes('semnatura')) {
//           const xmlData = entry.getData().toString('utf8'); 
//           xml2js.parseString(xmlData, (err, result) => {
//             if (err) {
//               console.error(`Error parsing XML:`, err);
//               return;
//             }
//           invoice = parseInvoiceData(result);
//           });
//         }
//       });
//       return invoice
  
//     } catch (error) {
//       console.error('Error downloading or processing the ZIP file:', error);
//     }
//   }


// Call the function with your XML data


