
const jwt = require('jsonwebtoken');
const User = require('../../models/users/user');
const Locatie = require('../../models/office/locatie')
const SalePoint = require('../../models/utils/sale-point')


const { comparePasswords, hashPassword, round, generateSoketId } = require('../../utils/functions')
const { sendCompleteRegistrationEmail, sendInfoAdminEmail,   sendResetEmail, sendVerificationEmail, sendEmployeeEmail } = require('../../utils/mail')
const {generateMood, horoscop} = require('../../controlers/gbt')


module.exports.encodeUserID = async (req, res) => {
    const {xx4} = req.query
    try{
        const payload = {
            xx4,
            createdAt: Date.now()
          };
          const token = jwt.sign(payload, process.env.AUTH_SECRET, { expiresIn: '10m' });
          res.status(200).json(token)

    } catch(error) {
        console.log(error)
        res.status(500).json(error)
    }
}

module.exports.decodeUserToken = async (req, res) => {
    const {token} = req.body
    if (!token) return res.status(400).json({ error: 'Missing token' });
    try{
        const decoded = jwt.verify(token, process.env.AUTH_SECRET);
        res.status(200).json(decoded)
    } catch(error) {
        console.log(error)
        res.status(500).json(error)
    }
}

module.exports.register = async (req, res, next) => {
    try{
        const { email, password, tel, confirmPassword, name, firstCart, survey, id, loc, url} = req.body;
       if(id && id.length){
        if (password === confirmPassword) {
            const hashedPassword = hashPassword(password);
            const update = {
                password: hashedPassword,
                telephone: tel,
                survey: survey,
            }
            const user = await User.findByIdAndUpdate(id, update, {new: true})
            
            res.status(200).json({ message: "Datele au fost actualizate.", user: user});
        } else {
            return res.status(401).json({ message: "Passwords don't match!" });
        };
       } else {
           const check = await User.findOne({ email: email, locatie: loc });
           if (check) {
               return res.status(256).json({ message: 'This email allrady exist' });
           }
           if (password === confirmPassword) {
               const hashedPassword = hashPassword(password);      
               const otp = generateSoketId(4)
               const newUser = new User({
                   email: email,
                   password: hashedPassword,
                   name: name,
                   telephone: tel,
                   firstCart: firstCart,
                   survey: survey,
                   locatie: loc,
                   cashBackProcent: 5,
                   otp: {code: otp, date: new Date()}
               });
               if(loc === '65ba7dcf1694ff43f52d44ed'){
                    newUser.discount.general = 10
                    newUser.cashBackProcent = 10
                    newUser.discount.category.push({precent: 0, name: 'Cafea pentru acasa', cat: "65bb5fdb04258e1abf216a3d"})
                    newUser.discount.category.push({precent: 0, name: 'Sucuri', cat: "65bb5cb804258e1abf216a28"})
                    newUser.discount.category.push({precent: 0, name: 'Patiserie', cat: "65cc686ad78998e172bfee6b"})
                }   
                await newUser.save();
                const dbUser = await User.findOne({email: email, locatie: loc}).populate({path: 'locatie'})
                sendVerificationEmail(dbUser).then(response => {
                   if (response.message === 'Email sent') {
                       res.status(200).json({ message: response.message, id: newUser._id });
                   } else {
                       res.status(256).json({ message: response.message, id: newUser._id });
                   };
               });
           } else {
               return res.status(401).json({ message: "Passwords don't match!" });
           };
       }
    } catch (error) {
        console.log(error)
        res.status(500).json(error)
    }
};



module.exports.updateUserData = async (req, res) => {
    const {data} = req.body
    try{
        if(data.mode === 'password'){
            const user = await User.findById(data.userId)

            if (!user || !comparePasswords(data.oldPassword, user.password)) {
            return res.status(401).json({ message: 'Parola actuala nu este corectă!' });
            } 

            if (data.password === data.confirmPassword) {
                const hashedPassword = hashPassword(data.password);
                const update = {
                    password: hashedPassword,
                    name: data.name,
                    telephone: data.telephone,
                    email: data.email
                }
                const savedUser = await User.findByIdAndUpdate(user._id, update, {new: true})
                
                res.status(200).json({ message: "Datele au fost actualizate.", user: savedUser});
            }
        } else {
           const update = {
                name: data.name,
                telephone: data.telephone,
                email: data.email
            }
            const savedUser = await User.findByIdAndUpdate(data.userId, update, {new: true})
            res.status(200).json({ message: "Datele au fost actualizate.", user: savedUser});
        }
    } catch(error) {
        res.status(500).json(error)
        console.log(error)
    }

}

module.exports.resendOTP = async (req, res) => {
    const {id} = req.query
    try{
        const otp = generateSoketId(4)
        const user = await User.findByIdAndUpdate(id, {otp: {code: otp, date: new Date()}}, {new: true}).populate({path: 'locatie'})
        if(user){
        sendVerificationEmail(user).then(response => {
            if (response.message === 'Email sent') {
                res.status(200).json({ message: response.message });
            } else {
                res.status(256).json({ message: response.message});
            };
        });
        } else {
            res.status(200).json({message: 'Utilizatorul nu a fost găsit!'})
        }
    } catch(error) {
        console.log(error)
        res.status(500).json(error)
    }
}

module.exports.verifyOTP = async (req, res) => {
    const {otp} = req.body
    try{
        const user = await User.findOne({otp: { $exists: true }, 'otp.code': otp, }).populate({path: 'locatie'})
        if(user){
            const now = new Date().getTime()
            const otpDate = new Date(user.otp.date).getTime()
            if( now - otpDate < 300000){
                user.status = 'active'
                await user.save()
                const token = jwt.sign({ userId: user._id }, process.env.AUTH_SECRET, { expiresIn: '1d'});
                const sendData = addUserData(user, token)
                res.status(200).json({message: 'valid', id: user._id, user: sendData})
            } else {
                res.status(200).json({message: 'expired', id: user._id})
            }
        } else {
            res.status(200).json({message: 'invalid'})
        }
    } catch(error) {
        console.log(error)
        res.status(500).json(error)
    }
}


module.exports.checkInOrOut = async (req, res) => {
    const {userId, checkIn} = req.body
    try{
        const user = await User.findByIdAndUpdate(userId, {checkIn: checkIn}, {new: true})
        const userAge = (new Date().getTime() - new Date(user.employee.birthDate).getTime()) /1000/60/60/24/365

        const messageData = {
            name: user.employee.fullName.split(' ')[0],
            position: user.employee.position,
            zodie: user.employee.zodie,
            age: round(userAge),
            status: checkIn.value ? 'abia ce am intrat in tură la serviciu si vreau să am stare buna pentru ziua de lucru' : 'tocmai ce am ieșit din tură de lucru si vreau sa am o stare buna ca sa ma pot bucura de restul zilei',
            gender: getGenderFromCNP(user.employee.cnp)
        }
        const message = await generateMood(messageData)
        res.status(200).json({message: 'utilizatorul a fost actualizat', mood: message, user: user})
    } catch(error){
        console.log(error)
        res.status(500).json(error)
    }
}





module.exports.getHoroscop = async (req, res, next) => {
    const { id } = req.query
    try{
        const user = await User.findById(id)
        const userAge = (new Date().getTime() - new Date(user.employee.birthDate).getTime()) /1000/60/60/24/365
        const messageData = {
            name: user.employee.fullName.split(' ')[0],
            position: user.employee.position,
            zodie: user.employee.zodie,
            age: round(userAge),
            birth: user.employee.birthDate,
            gender: getGenderFromCNP(user.employee.cnp)
        }
      const response = await horoscop(messageData)
      res.status(200).json(response)
    } catch(error){
      console.log(error)
      res.status(500).json(error)
    }
  }


function getGenderFromCNP(cnp = 1234567890234) {
    const firstDigit = parseInt(cnp[0], 10);
    switch (firstDigit) {
      case 1:
      case 3:
      case 5:
        return "un barbat";
      case 2:
      case 4:
      case 6:
        return "o femeie";
      default:
        return "gen necunoscut";
    }
  }




module.exports.registerNewEmployee = async (req, res) => {
    try{
        const {user, url} = req.body
        if(user){
            const check = await User.findOne({ email: user.email, locatie: user.locatie });
            if (check) {
                return res.status(256).json({ message: 'This email allrady exist' });
            }
            const newUser = new User(user)
            const savedUser = await newUser.save()
            const dbUser = await User.findById(savedUser._id).populate({path: 'locatie'})
            const response = await sendEmployeeEmail(dbUser, url)
            res.status(200).json({message: 'Utilizatorul a fost salvat ' + response.message})
        }


    } catch(error){
        console.log(error)
    }
}


module.exports.registerIn = async (req, res) => {
    try{
        const {name, password, confirmPassword, telephone, ciSerial, ciNumber, releaseId, address, releaseDate, userId, cnp, adminEmail} = req.body
        if(userId && userId.length){
            if (password === confirmPassword) {
                const hashedPassword = hashPassword(password);
                const user = await User.findById(userId).populate({path: 'locatie'})
                user.password = hashedPassword;
                user.telephone = telephone;
                user.status = 'active',
                user.employee.fullName = name,
                user.employee.cnp = cnp
                user.employee.ciSerial = ciSerial;
                user.employee.ciNumber = ciNumber;
                user.employee.releaseId = releaseId;
                user.employee.releaseDate = releaseDate;
                user.employee.address = address;
                if(req.file) {
                    const { path, filename } = req.file;
                    const img = {
                        name: 'ID',
                        filename: filename,
                        url: path
                    }
                    user.employee.docs = [img]
                }
                await user.save()
                const data = {name: user.name, action: 's-a inregistrat'}
                const gmail = {app: user.locatie.gmail.app, email: user.locatie.gmail.email} 
                await sendInfoAdminEmail(data, adminEmail ,gmail)
                res.status(200).json({ message: "Datele au fost actualizate.", user: user});
            } else {
                return res.status(401).json({ message: "Passwords don't match!" });
            };
           } else{
            res.status(404).json({message: 'Utilizarorul nu a fost gasit'})
           }
    } catch(err){
        console.error(err)
        res.status(500).json(err)
    }
}


module.exports.verifyEmployeeToken = async (req, res, next) => {
    const { token } = req.body;
    try {
        const userId = jwt.decode(token, process.env.AUTH_SECRET);
        if (userId) {
            const user = await User.findById(userId.userId).populate({path: 'locatie'});
            if (user) {
                res.status(200).json(user);
            } else {
                res.status(404).json({ message: 'User not found' });
            };
        } else {
            res.status(401).json({ message: 'Invalid token' });
        };
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: 'Server Error' });
    }
}

module.exports.registerEmployee = async (req, res, next) => {
    try{
         const {user, second} = req.body
         if(second && user){
            if(second.password === second.confirmPassword){
                const hashedPassword = hashPassword(second.password)
                const newUser = new User(user);
                newUser.password = hashedPassword
                await newUser.save()
                res.status(200).json({message: "Userul a fost Salvat cu success"})
            } else{
                return res.status(401).json({ message: "Passwords don't match!" });
            }
         } else {
            return res.status(401).json({ message: "No USER!!" });
         }
    } catch (err){
        console.log(err)
        res.status(500).json(err.message)
    }
}



module.exports.login = async (req, res, next) => {
    const { email, password, url, adminEmail, loc} = req.body;

    try{
               const user = await User.findOne({ email: email, locatie: loc})
                            .select([
                                '-employee.cnp',
                                '-employee.ciSerial',
                                '-employee.ciNumber',
                                '-employee.address',
                            ])
                            .populate({
                                    path: 'locatie'
                            })
    if (!user || !comparePasswords(password, user.password)) {
        return res.status(401).json({ message: 'Invalid email or password' });
    };
    if (user.status === 'inactive') {
        return  sendVerificationEmail(user).then(response => {
            const userData = {
                name: user.name,
                email: user.email,
                id: user.id,
                locatie: user.locatie._id
            };
            if (response.message === 'Email sent') {
                res.status(200).json({ message: response.message, user: userData })
            } else {
                res.status(256).json({ message: response.message, user: userData })
            };
        });
    } else if (user.status === "active") {
        let expireDate = user.admin === 1 ? '7d' : '1d'
        const token = jwt.sign({ userId: user._id }, process.env.AUTH_SECRET, { expiresIn:  expireDate});
        const sendData = addUserData(user, token)
        res.status(200).json(sendData);
    };

    } catch(err){
        console.log(err)
        res.status(500).json({message: err.message})
    }

};


function addUserData (user, token) {
    console.log(user)
    const sendData = {
        token: token,
        name: user.name,
        admin: user.admin,
        cashBack: user.cashBack,
        email: user.email,
        status: user.status,
        telephone: user.telephone,
        employee: user.employee,
        locatie: user.locatie._id,
        discount: user.discount,
        profilePic: user.profilePic,
        hobbies: user.hobbies,
        description: user.description,
        checkIn: user.checkIn,
        orders: user.orders,
        cashBackProcent: user.cashBackProcent,
    };
    return sendData
}




module.exports.verifyToken = async (req, res, next) => {
    const { token } = req.body;
    try {
        const userId = jwt.decode(token, process.env.AUTH_SECRET);
        if (userId) {
            const user = await User.findById(userId.userId).populate({path: 'locatie'});
            if (user) {
                user.status = 'active';
                await user.save();
                const userData = {
                    token: token,
                    name: user.name,
                    admin: user.admin,
                    cashBack: user.cashBack,
                    email: user.email,
                    status: user.status,
                    cardIndex: user.cardIndex,
                    telephone: user.telephone ? user.telephone : '-',
                    _id: user._id,
                    employee: user.employee,
                    locatie: user.locatie._id
                };
                res.status(200).json(userData);
            } else {
                res.status(404).json({ message: 'User not found' });
            };
        } else {
            res.status(401).json({ message: 'Invalid token' });
        };
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: 'Server Error' });
    }
}



module.exports.sendEmailResetPassword = async (req, res, next) => {
    try {
        const { email, loc, url } = req.body;
        const user = await User.findOne({ email: email, locatie: loc }).populate({path: 'locatie'});
        if (user) {
            return sendResetEmail(user, url).then(response => {
                const userData = {
                    name: user.name,
                    email: user.email,
                    id: user.id,
                };
                if (response.message === 'Email sent') {
                    res.status(200).json({ message: response.message, user: userData })
                } else {
                    res.status(256).json({ message: response.message, user: userData })
                };
            });
        } else {
            res.status(404).json({ message: 'Adresa de email nu se află în baza de date!' })
        };
    } catch (err) {
        console.log('Error', err.message);
        res.status(500).json({ message: 'Server message' });
    }

}

module.exports.resetPassword = async (req, res, next) => {
    const { token, password, confirmPassword, adminEmail = 'alin@truefinecoffee.ro'} = req.body;
    try {
        const userId = jwt.decode(token, process.env.AUTH_SECRET);
        if (userId) {
            const user = await User.findById(userId.userId).populate({path: 'locatie'});
            if (user) {
                if (password === confirmPassword) {
                    const hashedPassword = hashPassword(password);
                    user.password = hashedPassword;
                    await user.save();
                }
                const userData = {
                    token: token,
                    name: user.name,
                    admin: user.admin,
                    cashBack: user.cashBack,
                    email: user.email,
                    status: user.status,
                    telephone: user.telephone,
                    employee: user.employee,
                    locatie: user.locatie,
                    discount: user.discount,
                };
                const data = {name: user.name, action: 'și-a resetat parola'}
                await sendInfoAdminEmail(data, adminEmail, user.locatie.gmail)
                res.status(200).json(userData);
            } else {
                res.status(404).json({ message: 'User not found' });
            }
        } else {
            res.status(401).json({ message: 'Invalid token' });
        };
    } catch (err) {
        console.log(err.message);
        res.status(500).json({ message: 'Server Error' });
    };
}


module.exports.getLoc = async (req, res) => {
    try{
        const {id} = req.query 
        const loc = await Locatie.findById(id)
        res.status(200).json({ip: loc.pos.vivaWalletLocal.ip, port: loc.pos.vivaWalletLocal.port})
    } catch(err){
        res.status(500).json(err)
    }
}


module.exports.addSalePoint = async (req, res) => {
    try{
        const {salePoint} = req.body
        const newPoint = new SalePoint(salePoint)
        const savedPoint = await newPoint.save()
        res.status(200).json(savedPoint)
    } catch(error){
        console.log(error)
        res.status(500).json(error)
    }
}

module.exports.deleteSalePoint = async (req, res) => {
    try{
        const {id} = req.query
        await SalePoint.findByIdAndDelete(id)
        res.status(200).json({message: 'Punctul de lucru a fost sters cu success!'})
    } catch(error){
        console.log(error)
        res.status(500).json(error)
    }
}

module.exports.getSalePoints = async (req, res) => {
    try{
        const {loc} = req.query
        const points = await SalePoint.find({locatie: loc})
        res.status(200).json(points)
    } catch(error){
        console.log(error)
        res.status(500).json(error)
    }
}














