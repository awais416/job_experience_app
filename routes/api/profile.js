const express = require('express')
const router = express.Router()
const auth = require('../../middleware/auth')
const Profile = require('../../models/Profile')
const User = require('../../models/User')
const { check, validationResult } = require('express-validator')
const request = require('request')
const config = require('config')
const axios = require('axios')
const { response } = require('express')
// @route GET api/Profile/me
// @desc Get current users profile
// @acess private
router.get('/me', auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({
      user: req.user.id,
    }).populate('user', ['name', 'avatar'])
    if (!profile) {
      return res.status(400).json({ msg: 'There is no profile for this user' })
    }
    res.json(profile)
  } catch (err) {
    console.error(err.message)
    res.status(500).send('Server error')
  }
})

// @route GET api/Profile/me
// @de sc Create or update users profile
// @acess private

router.post(
  '/',
  [
    auth,
    [
      check('status', 'Status is required').not().isEmpty(),
      check('skills', 'Skills is required').not().isEmpty(),
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }
    const {
      company,
      website,
      location,
      bio,
      status,
      skills,
      githubusername,
      // spread the rest of the fields we don't need to check
      ...rest
    } = req.body
    const profileFields = {}
    profileFields.user = req.user.id
    if (skills) {
      profileFields.skills = skills.split(',').map((el) => el.trim())
    }
    if (status) profileFields.status = status
    if (company) profileFields.company = company
    if (bio) profileFields.bio = bio
    if (website) profileFields.website = website
    if (location) profileFields.location = location
    if (githubusername) profileFields.githubusername = githubusername
    console.log({ profileFields })

    try {
      let profile = await Profile.findOne({ user: req.user.id })
      if (profile) {
        // Update Profile
        profile = await Profile.findOneAndUpdate(
          { user: req.user.id },
          { $set: profileFields },
          { new: true }
        )
        return res.json(profile)
      }
      // Create Profile

      profile = new Profile(profileFields)
      await profile.save()
      res.json(profile)
    } catch (err) {
      console.error(err.message)
      return res.status(500).send('Server Error')
    }
  }
)

// @route GET api/Profile
// @desc get all profiles
// @acess Public
router.get('/', async (req, res) => {
  try {
    const profile = await Profile.find().populate('user', ['name', 'avatar'])
    res.json(profile)
  } catch (err) {
    console.error(err.message)
    return res.status(500).send('Server Error')
  }
})

// @route GET api/Profile/users/:user_id
// @desc profile by user ID
// @acess Public
router.get('/user/:user_id', async (req, res) => {
  try {
    const profile = await Profile.findOne({
      user: req.params.user_id,
    }).populate('user', ['name', 'avatar'])
    if (!profile)
      return res.status(400).json({ msg: 'No profile for this user' })
    res.json(profile)
  } catch (err) {
    console.error(err.message)
    if (err.kind == 'ObjectId')
      return res.status(400).json({ msg: 'Profile not found ' })
    return res.status(500).send('Server Error')
  }
})

// @route Delete api/Profile
// @desc Delete profile, user & posts
// @acess Private
router.delete('/', auth, async (req, res) => {
  try {
    // @todo - remove users posts

    //remove profile
    await Profile.findOneAndDelete({ user: req.user.id })

    //remove user
    await User.findOneAndDelete({ _id: req.user.id })
    res.json({ msg: 'User deleted' })
  } catch (err) {
    console.error(err.message)
    return res.status(500).send('Server Error')
  }
})

// @route Put api/profile/experience
// @desc add profile experienece
// @acess Private
router.put(
  '/experience',
  [
    auth,
    [
      check('title', 'Title is required').not().isEmpty(),
      check('company', 'Company is required').not().isEmpty(),
      check('from', 'From date is required').not().isEmpty(),
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }
    const { title, company, location, from, to, current, description } =
      req.body
    const newExp = { title, company, location, from, to, current, description }

    try {
      const profile = await Profile.findOne({ user: req.user.id })

      profile.experience.unshift(newExp)
      await profile.save()
      res.json(profile)
    } catch (err) {
      console.error(err.message)
      return res.status(500).send('Server Error')
    }
  }
)

// @route Delete api/Profile/experience/:exp_id
// @desc delete experience from profile
// @acess Private
router.delete('/experience/:exp_id', auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({
      user: req.user.id,
    })

    const removeIndex = profile.experience
      .map((el) => el.id)
      .indexOf(req.params.exp_id)
    profile.experience.splice(removeIndex, 1)
    await profile.save()
    res.json(profile)
  } catch (err) {
    console.error(err.message)
    return res.status(500).send('Server Error')
  }
})

// @route Get api/profile/github/:username
// @desc get user repos from Github
// @acess Public
router.get('/github/:username', async (req, res) => {
  const options = {
    uri: `https://api.github.com/users/${
      req.params.username
    }/repos?per_page=5&sort=created:asc&client_id=${config.get(
      'githubClientId'
    )}&client_secret=${config.get('githubSecret')}`,
    method: 'GET',
    headers: { 'user-agent': 'node.js' },
  }
  try {
    request(options, (error, response, body) => {
      if (response.statusCode !== 200) {
        return res.status(404).json({ msg: 'No Github profile found' })
      }
      res.json(JSON.parse(body))
    })
  } catch (err) {
    console.error(err)
    if (err.status === 404) {
      return res.status(404).json({ msg: 'No Github profile found' })
    }
    return res.status(500).send(err)
  }
  //   try {
  //     const response = await axios(
  //       `https://api.github.com/users/${
  //         req.params.username
  //       }/repos?per_page=5&sort=created:asc&client_id=${config.get(
  //         'githubClientId'
  //       )}&client_secret=${config.get('githubSecret')}`
  //     )
  //     console.log({ response })
  //     // res.json(response.data)
  //   } catch (err) {
  //     // console.error(err)
  //     // if (err.status === 404) {
  //     //   return res.status(404).json({ msg: 'No Github profile found' })
  //     // }
  //     // return res.status(500).send(err)
  //   }
})

module.exports = router
