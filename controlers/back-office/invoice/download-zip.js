const axios = require('axios')
const AdmZip = require('adm-zip');
const {parseXml, parseInvoiceData, parseHeaderFromXml} = require('./parseXml')

// const mode = 'test'
const mode = 'prod'

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
      const response = await axios.get(`https://api.anaf.ro/${mode}/FCTEL/rest/descarcare?id=${id}`, {
        responseType: 'arraybuffer',
        headers: {
          'Authorization': `Bearer ${process.env.TOKEN_ANAF}`,
          'Accept': 'application/zip',
        },
      });
  
      const buffer = Buffer.from(response.data);
      if (buffer[0] === 0x50 && buffer[1] === 0x4B) {
        const zip = new AdmZip(buffer);
        const files = zip.getEntries().map(entry => ({
          fileName: entry.entryName,
          content: entry.getData().toString('utf8'),
        }));
        let errorMessage = []
  
        for(let f of files){
          if(!f.fileName.includes('semnatura')){
            const header = await parseHeaderFromXml(f.content)
            const err = header.Error
            if(Array.isArray(err)){
                for(let e of err){
                  errorMessage.push(e?.$?.errorMessage)
                }
            } else {
                errorMessage.push(err.$?.errorMessage)
            }
        }
        }
        return { errors: errorMessage.join('<br> *****END**** <br>')};
      } else {
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


  module.exports = {downloadZipFile, downloadZipFileCheck}


