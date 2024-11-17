const axios = require('axios')
const https = require('https');
const fs = require('fs')

const AdmZip = require('adm-zip');
const xml2js = require('xml2js');



const startDate = new Date('2024-11-10').getTime()
const endDate = new Date('2024-11-16').getTime()

const apiUrl = 'https://api.anaf.ro/prod/FCTEL/rest/listaMesajeFactura?zile=10&cif=44994432'

const apiUrl1 = `https://api.anaf.ro/prod/FCTEL/rest/listaMesajePaginatieFactura?startTime=${startDate}&endTime=${endDate}&cif=44994432&pagina=1`

const downloadApi = 'https://api.anaf.ro/prod/FCTEL/rest/descarcare?id=3862015944'
                 






module.exports.getInvoices = async (req, res) => {


    const config = {
        // httpsAgent: agent,
        headers: {
          'Authorization': `Bearer ${process.env.TOKEN_ANAF}`,
          'Content-Type': 'application/json',  // Optional: Set content type if needed
        }
      }


    try{
       const result = await downloadZipFile()

        // axios.get(apiUrl, config)
        //     .then(response => {
        //         res.status(200).json(response.data)
        //         console.log(response.data)
        //     })
        //     .catch(error => {
        //         console.log(error);
        //         // console.log(error.toJSON());
        //     }) 

    res.status(200)

    }catch(error){
        console.log(error)
        res.status(500).json(error)
    }
}

async function downloadZipFile() {
    try {
      const response = await axios.get(downloadApi, {
        responseType: 'arraybuffer', // Treat the response as binary data
        headers: {
          // Include any required headers here, like authorization if needed
          'Authorization': `Bearer ${token}`, // Optional if you have a token
          'Accept': 'application/zip',
        },
      });
  
      // Use AdmZip to extract the contents directly from the buffer (in memory)
      const zip = new AdmZip(response.data);
  
      // Extract files to memory
      const zipEntries = zip.getEntries(); // Array of entries in the zip file

      // Loop through each entry in the zip file and save them locally
    //   let resultt
      zipEntries.forEach(entry => {
        if (!entry.entryName.includes('semnatura')) {
          const xmlData = entry.getData().toString('utf8'); 
          // Parse the XML to a JS object
          xml2js.parseString(xmlData, (err, result) => {
            if (err) {
              console.error(`Error parsing XML:`, err);
              return;
            }
  
            // Process the parsed XML as needed
            // console.log(JSON.stringify(result, null, 2))
            parseInvoiceData(result);
          });
        }
      });
    //   return resultt
  
    } catch (error) {
      console.error('Error downloading or processing the ZIP file:', error);
    }
  }





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
          quantity: item["cbc:InvoicedQuantity"][0]["_"], // Quantity
          price: item["cac:Price"][0]["cbc:PriceAmount"][0]["_"], // Price per unit
          totalNoVat: item["cbc:LineExtensionAmount"][0]["_"], // Line total
          vatPrecent: item["cac:Item"][0]["cac:ClassifiedTaxCategory"][0]["cbc:Percent"][0]
        })),
        vatAmount: invoiceData.Invoice["cac:TaxTotal"][0]["cbc:TaxAmount"][0]["_"], // VAT amount
        taxExclusiveAmount: invoiceData.Invoice["cac:LegalMonetaryTotal"][0]["cbc:TaxExclusiveAmount"][0]["_"],
        taxInclusiveAmount: invoiceData.Invoice["cac:LegalMonetaryTotal"][0]["cbc:TaxInclusiveAmount"][0]["_"],
        prePaydAmount: invoiceData.Invoice["cac:LegalMonetaryTotal"][0]["cbc:PrepaidAmount"] ? invoiceData.Invoice["cac:LegalMonetaryTotal"][0]["cbc:PrepaidAmount"][0]["_"] : 0,
        payableAmont: invoiceData.Invoice["cac:LegalMonetaryTotal"][0]["cbc:PayableAmount"][0]["_"], // Total amount (Payable)
      };
      console.log(invoiceSummary)
};

// Call the function with your XML data


