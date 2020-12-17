// imports
import JwtService from "./jwt.service";
import bcrypt from 'bcrypt';
import Model from '../models/index';
import Util from "../utils/customResponse";


class AuthService {

    constructor() {
        this.jwt = new JwtService();
        this.user = new Model().user();
        this.util = new Util();
    };

    /**
     * 
     * @param {*} user Users
     * @description generate token jwt, this only triggers if all the validation is meet the conditions
     * @returns JwtToken1
     */
    async generateToken(user) {

        const token = this.jwt.signInToken(user);

        return token;
    };

    /**
     * 
     * @param {*} password string
     * @description Password Hashing using bcrypt
     * @returns hashedPassword with length 10
     */
    async hashPassword(password) {

        const hashPassword = bcrypt.hashSync(password, 10);

        return hashPassword;
    };


    /**
     * 
     * @param {*} response Response
     * @param {*} user { email: string , password: string }
     * @async userRegister
     * @description Service to Register user to the Database
     * @returns Users { id: number, fullname: string, username: string, wallet: number }
     */
    async userRegister(response, user) {

        const { email, password } = user;

        const emailCheck = await this.checkIfEmailExist(email);

        if (emailCheck) {
            this.util.setError(401, "Email has been used, please use another email");
            return this.util.send(response);
        };

        // else 

        const hashPassword = await this.hashPassword(password);


        const newUser = await this.user.create({ ...user, password: hashPassword });

        // generate token
        // const token = await this.generateToken({ ...newUser});

        this.util.setSuccess(201, "User Created!", newUser);

        return this.util.send(response);

    };

    /**
     * 
     * @param {*} email string
     * @description email validation, check email if exists
     * @returns Null | Users
     */
    async checkIfEmailExist(email) {

        return new Promise(async (resolve, reject) => {
            const check = await this.user.findOne({ where: { email: email } }, (err, data) => {
                return data;
            });

            resolve(check);;
        })

    };


    /**
     * 
     * @param {*} password string
     * @param {*} email string
     * 
     * @description compare client's password to database user's password, if match then the user is valid
     * @returns Boolean
     */
    async comparePassword(password, email) {

        const userData = await this.user.findOne({ where: { email } });
        let isPasswordMatch;

        if (userData) {
            isPasswordMatch = bcrypt.compareSync(password, userData.password);
        };

        return isPasswordMatch;

    }

    /**
     * 
     * @param {*} res Reponse
     * @param {*} user { password: string , email: string }
     * @description Service to User to Login, checks if data the user's input is valid or not
     * @returns JwtToken | if email not found return json { message : "Email not found" } | if email is valid but the password is incorrect return json { message : "password is incorrect, try again" }
     */
    async login(res, user) {


        const { password, email } = user;


        const validateUser = await this.validateUser(user);

        if (!validateUser) {
            this.util.setError(401, "Email not found");
            this.util.send(res);
            return;
        }


        const isPasswordMatch = await this.comparePassword(password, email);

        if (isPasswordMatch) {

            const userData = await this.user.findOne({ where: { email } });

            const token = await this.generateToken({ ...userData });

            this.util.setSuccess(201, "Login Successful", { token });
            return this.util.send(res);

        } else {

            this.util.setError(401, "password is incorrect, please try again");
            return this.util.send(res);

        }

    };

    /**
     * 
     * @param {*} body { email: string, password: string }
     * @description to validate user, literally using the other method ( checkEmailIfExist )
     * @returns Boolean 
     */
    validateUser(body) {

        const { email } = body;

        const isEmailValid = this.checkIfEmailExist(email);

        return isEmailValid;

    }

};

export default AuthService;