
const jwt = require('jsonwebtoken');
const User = require('../../models/users/user');
const Locatie = require('../../models/office/locatie')

const { comparePasswords, hashPassword } = require('../../utils/functions')
const { sendCompleteRegistrationEmail, sendInfoAdminEmail,   sendResetEmail, sendVerificationEmail, } = require('../../utils/mail')




module.exports.register = async (req, res, next) => {
    // const loc = '655e2e7c5a3d53943c6b7c53'
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


module.exports.registerEmployee = async (req, res, next) => {
    try{
         const {user, second} = req.body
         if(second && user){
            if(second.password === second.confirmPassword){
                const hashedPassword = hashPassword(second.password)
                const newUser = new User(user);
                newUser.password = hashedPassword
                await newUser.save()
                // await sendVerificationEmail(newUser).then(response => {
                //     if (response.message === 'Email sent') {
                //         res.status(200).json({ message: response.message, id: newUser._id });
                //     } else {
                //         res.status(256).json({ message: response.message, id: newUser._id });
                //     };
                // });
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
        // let time = '60m';
        // if (user.employee.access > 1) {
        //     time = '12h';
        // };
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
        console.log(url)
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
                    employee: user.employee,
                    locatie: user.locatie
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












