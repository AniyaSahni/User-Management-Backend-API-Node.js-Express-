const express = require("express");

const router = express.Router();

console.log("Auth Routes Loaded");

const {

    registerUser,
    loginUser,
    refreshToken,
    logoutUser,
    getAllUsers

} = require("../controllers/authController");

const {

    registerValidation,
    loginValidation,
    validate

} = require("../middleware/validation");

router.post(
    "/register",
    registerValidation,
    validate,
    registerUser
);

router.post(
    "/login",
    loginValidation,
    validate,
    loginUser
);

router.post("/refresh", refreshToken);

router.post("/logout", logoutUser);

router.get("/users", getAllUsers);

module.exports = router;