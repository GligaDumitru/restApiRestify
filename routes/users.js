const errors = require("restify-errors");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const auth = require("../auth");
const jwt = require("jsonwebtoken");
const config = require("../config");

module.exports = server => {
  // Register User
  server.post("/register", (req, res, next) => {
    const { email, password } = req.body;

    const user = new User({
      email,
      password
    });

    // crypting password
    bcrypt.genSalt(10, (err, salt) => {
      bcrypt.hash(user.password, salt, async (err, hash) => {
        // Hash Password
        user.password = hash;
        // Save the user
        try {
          const newUser = await user.save();
          res.send(201);
          next();
        } catch (err) {
          return next(new errors.InternalError(err.message));
        }
      });
    });
  });

  // Auth User
  server.post("/auth", async (req, res, next) => {
    const { email, password } = req.body;
    try {
      // Authentificate User
      const user = await auth.authenticate(email, password);
      // Create JWT
      const token = jwt.sign(user.toJSON(), config.JWT_SECRET, {
        expiresIn: "15m"
      });

      const { iat, exp } = jwt.decode(token);
      res.send({ iat, exp, token });
      next();
    } catch (err) {
      // User unauthorized
      return next(new errors.UnauthorizedError(err));
    }
  });
};
