const crypto = require('crypto');
const BlackList = require('../models/office/product/blacList')
const path = require('path');
const fs = require('fs');

function comparePasswords(password, hashedPassword) {
    const [salt, originalHash] = hashedPassword.split("$");
    const hash = crypto
        .pbkdf2Sync(password, salt, 1000, 64, "sha512")
        .toString("hex");
    return hash === originalHash;
}

function hashPassword(password) {
    const salt = crypto.randomBytes(16).toString("hex");
    const hash = crypto
        .pbkdf2Sync(password, salt, 1000, 64, "sha512")
        .toString("hex");
    return [salt, hash].join("$");
}

function round(num){
    return Math.round(num * 1000) / 1000
}


async function checkTopping(toppings, res, loc) {
    try{
        const blackList = await BlackList.findOne({locatie: loc})
        if(blackList && blackList.list.length){
            const matchBlackList = blackList.list.filter(item => toppings.includes(item))
            if(matchBlackList.length) {
               return res.status(226).json({message: `Ne pare rau! Produsele ${matchBlackList} nu mai sunt pe stoc!`})
            } else {
               return res.status(200).json({message: "All good"})
            }
        } else {
            return res.status(200).json({message: "All good"})
        }
    } catch (err) {
        console.log(err.message)
        res.status(500).json({message: err.message})
    }
}

function formatedDateToShow(date){
    if(date){
      const inputDate = new Date(date);
      const hours = inputDate.getHours();
      const minutes = inputDate.getMinutes();
      const hour = hours.toString().padStart(2, "0") + ":" + minutes.toString().padStart(2, "0");
      const monthNames = [
        "Ianuarie", "Februarie", "Martie", "Aprilie", "Mai", "Iunie",
        "Iulie", "August", "Septembrie", "Octombrie", "Noiembrie", "Decembrie"
      ];
      return `${inputDate.getDate().toString().padStart(2, '0')}-${monthNames[inputDate.getMonth()]}-${inputDate.getFullYear()} ora ${hour} `
    } else {
      return 'xx'
    }
    }

    function log(message, logFile){
        const logInfo = `${new Date().toLocaleTimeString()}  - ${message}\n`;
        const logFilePath = path.join(__dirname, 'logs', `${logFile}.log`);
      
        fs.appendFile(logFilePath, logInfo, (error) => {
          if (error) {
            console.error('Error writing to log file:', error);
          }
        });
    }


    
    function encryptData(data) {
        const secretKey = crypto.randomBytes(32); // 256 bits for AES-256
        const binaryData = Buffer.from(secretKey)
        const base64Encoded = binaryData.toString('base64')
        const iv = crypto.randomBytes(16); // Initialization Vector
        const cipher = crypto.createCipheriv('aes-256-cbc', secretKey, iv);
        let encryptedData = cipher.update(data, 'utf-8', 'hex');
        encryptedData += cipher.final('hex');
        return { iv: iv.toString('hex'), encryptedData, secret: base64Encoded };
    }
    
    // Function to decrypt data
    function decryptData(encryptedData, secret, iv) {
        const secretKey = Buffer.from(secret, 'base64')
        console.log(secretKey)
        const decipher = crypto.createDecipheriv('aes-256-cbc', secretKey, Buffer.from(iv, 'hex'));
        let decryptedData = decipher.update(encryptedData, 'hex', 'utf-8');
        decryptedData += decipher.final('utf-8');
        return decryptedData;
    }

module.exports = {comparePasswords, hashPassword, round, checkTopping, formatedDateToShow, log, encryptData, decryptData}
