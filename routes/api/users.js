const express = require('express')
const router = express.Router()
const { check, validationResult } = require('express-Validator')
const gravatar = require('gravatar')
const bcrypt = require('bcryptjs')
const User = require('../../models/User')
const jwt = require('jsonwebtoken')
const config = require('config')

// @route POST api/User
// @desc Register user
// @access Public
router.post(
  '/',
  [
    check('name', 'Name is required').not().isEmpty(),
    check('email', 'Please include a valid email').isEmail(),
    check(
      'password',
      'Please enter a password with 6 or more characters'
    ).isLength({ min: 6 }),
  ],
  async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const { name, email, password } = req.body
    try {
      let user = await User.findOne({ email }) // See if the user exist

      if (user) {
        return res
          .status(400)
          .json({ errors: [{ msg: 'User already exists' }] })
      }
      const avatar = gravatar.url(email, {
        // Get user's gravatar
        s: '200',
        r: 'pg',
        d: 'mm',
      })
      user = new User({ name, email, avatar, password })

      //Encrupt the password using Bcrypt
      const salt = await bcrypt.genSalt(10) // need salt for the hash
      user.password = await bcrypt.hash(password, salt) // creating a hash
      await user.save()

      const payload = {
        user: {
          id: user.id,
        },
      }

      jwt.sign(
        payload,
        config.get('jwtSecret'),
        { expiresIn: 360000 },
        (err, token) => {
          if (err) throw err
          res.json({ token })
        }
      )
    } catch (err) {
      console.error(err.message)
      res.status(500).send('Server Error')
    }
  }
)

module.exports = router
