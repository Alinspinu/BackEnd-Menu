
const jwt = require('jsonwebtoken');
const User = require('../../models/users/user');
const Locatie = require('../../models/office/locatie')

const { comparePasswords, hashPassword } = require('../../utils/functions')
const { sendCompleteRegistrationEmail, sendInfoAdminEmail,   sendResetEmail, sendVerificationEmail, sendEmployeeEmail } = require('../../utils/mail')




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
                locatie: loc
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
               const newUser = new User({
                   email: email,
                   password: hashedPassword,
                   name: name,
                   telephone: tel,
                   firstCart: firstCart,
                   survey: survey,
                   locatie: loc,
                   cashBackProcent: 5,
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
                sendVerificationEmail(dbUser, url).then(response => {
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
           }
        res.status(200)
    } catch(err){
        console.error(err)
        res.status(500).json(err)
    }
}


module.exports.verifyEmployeeToken = async (req, res, next) => {
    const { token } = req.body;
    try {
        const userId = jwt.decode(token, process.env.AUTH_SECRET);
        console.log(userId)
        if (userId) {
            const user = await User.findById(userId.userId).populate({path: 'locatie'});
            console.log(user)
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
        return  sendVerificationEmail(user, url).then(response => {
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
        const token = jwt.sign({ userId: user._id }, process.env.AUTH_SECRET, { expiresIn: '7d'});
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
        };
        const data = {name: user.name, action: 's-a conectat'}
         sendInfoAdminEmail(data, adminEmail, user.locatie.gmail)
        res.status(200).json(sendData);
    };

    } catch(err){
        console.log(err)
        res.status(500).json({message: err.message})
    }

};





module.exports.verifyToken = async (req, res, next) => {
    const { token, adminEmail } = req.body;
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
                const data = {name: user.name, action: 's-a inregistrat'}
                const gmail = {app: user.locatie.gmail.app, email: user.locatie.gmail.email} 
                await sendInfoAdminEmail(data, adminEmail ,gmail)
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
    const { token, password, confirmPassword, adminEmail} = req.body;
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
        console.log(id)
        const loc = await Locatie.findById(id)
        res.status(200).json({ip: loc.pos.vivaWalletLocal.ip, port: loc.pos.vivaWalletLocal.port})
    } catch(err){
        res.status(500).json(err)
    }
}














