const axios = require("axios");
const sharp = require("sharp");

function getRawEscPosBytes(data, products) {
    const encoder = new TextEncoder();
  
    const reset = '\x1B\x40';       
    const boldOn = '\x1B\x45\x01';    
    const boldOff = '\x1B\x45\x00';    
    const cut = '\x1D\x56\x01';          
    const lf = '\x0A';                   
    const undelineOn = '\x1B\x2D\x01';
    const undelineOff = '\x1B\x2D\x00';
    const left = '\x1B\x61\x00';
    const center = '\x1B\x61\x01';
    const right = '\x1B\x61\x02'
    const doubleWH = '\x1D\x21\x11'
    const doubleW = '\x1D\x21\x01'
    const doubleH = '\x1D\x21\x10'
    const normalSize = '\x1D\x21\x00';
  
    let content = '';
    content += reset;
    content += doubleWH + boldOn  + center + undelineOn + `Masa ${data.masa}\n` + undelineOff + lf;
    content += normalSize + `Ora: ${data.time}\n` + boldOff + lf;
    content += doubleH + `${data.employee.fullName.split(' ')[0]}` + lf + lf;
    content += left + normalSize
    products.forEach((item) => {
      const name = item.name || ' ';
      const qty = item.quantity || 1;
      const toppings = item.toppings || []
      const comment = item.comment || ''

      content += `  ${qty} X ${name}\n`;
      if(toppings.length) {
        for(let t of toppings){
            content += `     + ${t.name}` + lf;
        }
      }
      if(comment.length) {
        content += `      - ${comment}` + lf
      }
      content += '\n'
    });
  
    content += center + '------------------END-------------------'

    content += lf+lf+lf+lf+lf+lf+lf+lf+lf+lf;
    content += reset
    content += cut 
    console.log(content)
    return encoder.encode(content);
  }



async function createBillForPrinter(order, logoUrl = ' ', qrUrl = ' ') {
  const reset      = Buffer.from([0x1B, 0x40]);      // ESC @
  const boldOn     = Buffer.from([0x1B, 0x45, 0x01]); // ESC E 1
  const boldOff    = Buffer.from([0x1B, 0x45, 0x00]); // ESC E 0
  const cut        = Buffer.from([0x1D, 0x56, 0x01]); // GS V 1
  const lf         = Buffer.from('\n', 'ascii');
  const underlineOn  = Buffer.from([0x1B, 0x2D, 0x01]);
  const underlineOff = Buffer.from([0x1B, 0x2D, 0x00]);
  const left       = Buffer.from([0x1B, 0x61, 0x00]); // left align
  const center     = Buffer.from([0x1B, 0x61, 0x01]); // center
  const doubleWH   = Buffer.from([0x1D, 0x21, 0x11]); // double width+height
  const doubleW = Buffer.from([0x1D, 0x21, 0x10]);
  const normalSize = Buffer.from([0x1D, 0x21, 0x00]);

  let parts = [];

  parts.push(reset);



  const logo = await imageToEscPosRaster(logoUrl, 184);
  parts.push(center, logo, lf, lf);

  parts.push(doubleWH, boldOn, center, underlineOn);
  parts.push(Buffer.from(`Comanda ${order.dayCounter}\n`, 'ascii'));
  parts.push(underlineOff, lf, lf);

  parts.push(left, normalSize);
  order.products.forEach((item) => {
    const normalName = stripRomanianDiacritics(item.name);
    const name = normalName.padEnd(23, " ");
    const price = item.price.toFixed(2).padStart(5, ' ');
    const t = +item.total
    const total = t.toFixed(2).padStart(5, ' ');
    const qty = item.quantity.toString();
    const toppings = item.toppings || [];
    const comment = item.comment || '';

    if (name.length > 23) {
      parts.push(Buffer.from(`${name}\n`, 'ascii'));
      parts.push(Buffer.from(`${' '.padEnd(23, " ")}${qty} BUC X ${price} = ${total} LEI\n`, 'ascii'));
    } else {
      parts.push(Buffer.from(`${name}${qty} BUC X ${price} = ${total} LEI\n`, 'ascii'));
    }

    if (toppings.length) {
      toppings.forEach((t) => {
        parts.push(Buffer.from(`     + ${t.name}\n`, 'ascii'));
      });
    }

    if (comment) {
      parts.push(Buffer.from(`     * ${comment}\n`, 'ascii'));
    }
  });

  if(order.discount > 0){
    parts.push(lf);
    parts.push(doubleW);
    parts.push(Buffer.from(`${'Subtotal '.padEnd(12, ' ' + order.totalProducts)} LEI \n`, 'ascii'))
    parts.push(lf, lf);
    parts.push(Buffer.from(`${'Discount client '.padEnd(12, ' ' + ' - ' + order.discount)} LEI \n`, 'ascii'))

  }

  if(order.tips > 0){
    parts.push(lf);
    parts.push(doubleW);
    parts.push(Buffer.from(`${'Subtotal '.padEnd(12, ' ' + order.totalProducts - order.discount)} LEI \n`, 'ascii'))
    parts.push(normalSize);
    parts.push(lf, lf);
    parts.push(Buffer.from(`${'Bacsis '.padEnd(12, ' ' + order.tips)} LEI \n`, 'ascii'))
  }

  parts.push(lf);
  parts.push(Buffer.from('-'.repeat(48) + '\n', 'ascii'));
  parts.push(doubleWH, boldOn);
  parts.push(Buffer.from(`${'TOTAL'.padEnd(12, ' ') + order.total.toFixed(2)} LEI \n`, 'ascii'));
  parts.push(boldOff, normalSize);
  parts.push(Buffer.from('-'.repeat(48) + '\n', 'ascii'));



  if(order.payment.cash > 0) {
    parts.push(Buffer.from(`${'Platit Numerar '.padEnd(12, ' ' + order.payment.cash)} LEI \n`, 'ascii'))
  }
  if(order.payment.card > 0) {
    parts.push(Buffer.from(`${'Platit Card '.padEnd(12, ' ' + order.payment.card)} LEI \n`, 'ascii'))
  }
  if(order.payment.online > 0) {
    parts.push(Buffer.from(`${'Platit card '.padEnd(12, ' ' + order.payment.online)} LEI \n`, 'ascii'))
  }

  
  parts.push(lf, lf);
  parts.push(Buffer.from('Aceasta este o nota de plata informativa. Ea trebuie sa fie insotita de bonul fiscal! \n',  'ascii'))
  parts.push(Buffer.from('Pentru valorile nutritionale si meniul online scaneaza codul QR. \n',  'ascii'))

  parts.push(lf);
  parts.push(Buffer.from('-'.repeat(48) + '\n', 'ascii'));
  parts.push(doubleWH, boldOn);
  parts.push(Buffer.from(`${'TOTAL'.padEnd(12, ' ') + order.total.toFixed(2)} LEI \n`, 'ascii'));
  parts.push(boldOff, normalSize);
  parts.push(Buffer.from('-'.repeat(48) + '\n', 'ascii'));



  const qr = await imageToEscPosRaster(qrUrl, 284);
  parts.push(center, qr, lf, lf);
  
  parts.push(center);
  parts.push(Buffer.from('MULTUMIM FRUMOS SI VA MAI ASTEPTAM! \n',  'ascii'))

  parts.push(lf, lf, lf,lf, lf, cut);

  return Buffer.concat(parts);
}



async function imageToEscPosRaster(imageUrl, maxWidth = 384, invert = false) {
  // 1. Download image
  const response = await axios.get(imageUrl, { responseType: "arraybuffer" });
  const inputBuffer = Buffer.from(response.data);

  // 2. Process with sharp
  const { data, info } = await sharp(inputBuffer)
    .resize({ width: maxWidth, withoutEnlargement: true })
    .flatten({ background: { r: 255, g: 255, b: 255 } }) // transparency -> white
    .grayscale()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const w = info.width;
  const h = info.height;
  const errorBuffer = new Float32Array(data);

  // 3. Floyd–Steinberg dithering
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = y * w + x;
      const oldPixel = errorBuffer[idx];
      const newPixel = oldPixel < 128 ? 0 : 255;
      const error = oldPixel - newPixel;
      errorBuffer[idx] = newPixel;

      if (x + 1 < w) errorBuffer[idx + 1] += error * 7 / 16;
      if (y + 1 < h) {
        if (x > 0) errorBuffer[idx + w - 1] += error * 3 / 16;
        errorBuffer[idx + w] += error * 5 / 16;
        if (x + 1 < w) errorBuffer[idx + w + 1] += error * 1 / 16;
      }
    }
  }

  // 4. Build ESC/POS raster data
  const bytesPerRow = Math.ceil(w / 8);
  let body = Buffer.alloc(bytesPerRow * h);

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const pixel = errorBuffer[y * w + x];
      const isBlack = invert ? pixel > 128 : pixel < 128;

      if (isBlack) {
        body[y * bytesPerRow + (x >> 3)] |= 0x80 >> (x % 8);
      }
    }
  }

  const xL = bytesPerRow & 0xff;
  const xH = (bytesPerRow >> 8) & 0xff;
  const yL = h & 0xff;
  const yH = (h >> 8) & 0xff;

  const header = Buffer.from([0x1D, 0x76, 0x30, 0x00, xL, xH, yL, yH]);
  const result = Buffer.concat([header, body]);

  // 5. Debug preview (optional)
//   await sharp(Buffer.from(errorBuffer), {
//     raw: { width: w, height: h, channels: 1 }
//   }).toFile("debug-output.png");

  console.log(`✅ Preview saved to debug-output.png (${w}x${h})`);

  return result;
}



function stripRomanianDiacritics(text) {
  return text
    .normalize("NFD")              // break into base + combining marks
    .replace(/[\u0300-\u036f]/g, "") // remove combining marks
    // also fix Romanian special cases just in case
    .replace(/ș|ş/g, "s")
    .replace(/ț|ţ/g, "t")
    .replace(/ă/g, "a")
    .replace(/â/g, "a")
    .replace(/î/g, "i")
    .replace(/Ș|Ş/g, "S")
    .replace(/Ț|Ţ/g, "T")
    .replace(/Ă/g, "A")
    .replace(/Â/g, "A")
    .replace(/Î/g, "I");
}



  module.exports = {getRawEscPosBytes, createBillForPrinter}