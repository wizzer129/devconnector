const express = require('express');
const router = express.Router();
const gravatar = require('gravatar');
const bcrypt = require('bcryptjs');

//Load User Model
const User = require('../../models/User');

// @route GET api/users/test
// @desc Test user route
// @access Public
router.get('/test', (req, res) => res.json({ msg: 'Users Works' }));

// @route GET api/users/register
// @desc register a user
// @access Public
router.post('/register', (req, res) => {
    User.findOne({ email: req.body.email }).then(user => {
        if (user) {
            errors.email = 'Email already exists';
            return res.status(400).json(errors);
        } else {
            const avatar = gravatar.url(req.body.email, {
                s: '200',
                r: 'r',
                d: 'mm'
            });

            const newUser = new User({
                name: req.body.name,
                email: req.body.email,
                avatar,
                password: req.body.password
            });

            bcrypt.genSalt(10, (err, salt) => {
                bcrypt.hash(newUser.password, salt, (err, hash) => {
                    if (err) {
                        console.log('bcrypt error');
                        throw err;
                    }
                    newUser.password = hash;
                    newUser
                        .save()
                        .then(user => res.json(user))
                        .catch(err => console.log(err));
                });
            });
        }
    });
});

// @route GET api/users/register
// @desc register a user
// @access Public
router.post('/login', (req, res) => {
    const email = req.body.email;
    const password = req.body.password;

    //Find user by email
    User.findOne({ email }).then(user => {
        //check for user
        if (!user) {
            return res.status(404).json({ email: 'User not found' });
        }
        //Check Password
        bcrypt.compare(password, user.password).then(isMatch => {
            if (isMatch) {
                res.json({ msg: 'Success' });
            } else {
                return res.status(400).json({ password: 'Password Incorrect' });
            }
        });
    });
});
module.exports = router;
