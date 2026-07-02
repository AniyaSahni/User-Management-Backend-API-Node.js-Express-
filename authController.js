const User = require("../models/User");
const bcrypt = require("bcryptjs");

const {
    generateAccessToken,
    generateRefreshToken
} = require("../utlis/generateToken");

// Register User
const registerUser = async (req, res) => {

    try {

        const { name, email, password } = req.body;

        const userExists = await User.findOne({ email });

        if (userExists) {
            return res.status(400).json({
                message: "User already exists"
            });
        }

        const salt = await bcrypt.genSalt(10);

        const hashedPassword = await bcrypt.hash(password, salt);

        const user = await User.create({

            name,
            email,
            password: hashedPassword

        });

        res.status(201).json({

            message: "User Registered Successfully"

        });

    } catch (error) {

        res.status(500).json({

            message: error.message

        });

    }

};

// Login User
const loginUser = async (req, res,next) => {

    try {

        const { email, password } = req.body;

        const user = await User.findOne({ email });

        if (!user) {

            return res.status(401).json({

                message: "Invalid Email"

            });

        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {

            return res.status(401).json({

                message: "Invalid Password"

            });

        }

        const accessToken = generateAccessToken(user._id);

        const refreshToken = generateRefreshToken(user._id);

        user.refreshToken = refreshToken;

        await user.save();

        res.cookie("refreshToken", refreshToken, {

            httpOnly: true,

            secure: false,

            sameSite: "strict",

            maxAge: 7 * 24 * 60 * 60 * 1000

        });

        res.status(200).json({

            message: "Login Successful",

            accessToken

        });

    } catch (error) {

        res.status(500).json({

            message: error.message

        });

    }

};
const refreshToken = async (req, res) => {

    try {

        const token = req.cookies.refreshToken;

        if (!token) {

            return res.status(401).json({

                message: "Refresh Token Missing"

            });

        }

        const jwt = require("jsonwebtoken");

        const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);

        const user = await User.findById(decoded.id);

        if (!user || user.refreshToken !== token) {

            return res.status(403).json({

                message: "Invalid Refresh Token"

            });

        }

        const accessToken = generateAccessToken(user._id);

        res.status(200).json({

            accessToken

        });

    } catch (error) {

        res.status(403).json({

            message: "Invalid or Expired Refresh Token"

        });

    }

};

const logoutUser = async (req, res) => {

    try {

        const token = req.cookies.refreshToken;

        if (!token) {

            return res.status(200).json({

                message: "Already Logged Out"

            });

        }

        const user = await User.findOne({ refreshToken: token });

        if (user) {

            user.refreshToken = null;

            await user.save();

        }

        res.clearCookie("refreshToken");

        res.status(200).json({

            message: "Logout Successful"

        });

    } catch (error) {

        res.status(500).json({

            message: error.message

        });

    }

};

// Get All Users with Pagination
const getAllUsers = async (req, res) => {

    try {

        const page = parseInt(req.query.page) || 1;

        const limit = parseInt(req.query.limit) || 5;

        const skip = (page - 1) * limit;

        const filter = {};

        if (req.query.role) {

            filter.role = req.query.role;

        }

        if (req.query.search) {

            filter.$or = [

                {
                    name: {
                        $regex: req.query.search,
                        $options: "i"
                    }
                },

                {
                    email: {
                        $regex: req.query.search,
                        $options: "i"
                    }
                }

            ];

        }

const totalUsers = await User.countDocuments(filter);

        const sort = req.query.sort || "createdAt";

        const users = await User.find(filter)
                .select("-password -refreshToken")
                .sort(sort)
                .skip(skip)
                .limit(limit);

        res.status(200).json({

            totalUsers,
            currentPage: page,
            totalPages: Math.ceil(totalUsers / limit),
            users

        });

    } catch (error) {

        next(error);

    }

};

module.exports = {

    registerUser,
    loginUser,
    refreshToken,
    logoutUser,
    getAllUsers

};