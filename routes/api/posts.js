const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const passport = require('passport');

// Post model
const Post = require('../../models/Post');

// Profile model
const Profile = require('../../models/Profile');

// Validation
const validatePostInput = require('../../validation/post');

// @route GET api/posts/test
// @desc Test post route
// @access Public
router.get('/test', (req, res) => res.json({ msg: 'Posts Works' }));

// @route Post api/post
// @desc Create post
// @access Public
router.post(
    '/',
    passport.authenticate('jwt', { session: false }),
    (req, res) => {
        const { errors, isValid } = validatePostInput(req.body);

        if (!isValid) {
            // If any errors, send 400 with errors object
            return res.status(400).json(errors);
        }
        const newPost = new Post({
            text: req.body.text,
            name: req.body.name,
            avatar: req.body.avatar,
            user: req.user.id
        });

        newPost.save().then(post => res.json(post));
    }
);

// @route GET api/post
// @desc GET all post
// @access Public
router.get('/', (req, res) => {
    Post.find()
        .sort({ date: -1 })
        .then(posts => res.json(posts))
        .catch(err => res.status(404).json({ nopostfound: 'No posts found' }));
});

// @route GET api/post/:id
// @desc GET Post by id
// @access Public
router.get('/:id', (req, res) => {
    Post.findById(req.params.id)
        .then(posts => res.json(posts))
        .catch(err =>
            res.status(404).json({ nopostfound: 'No post found with that ID' })
        );
});

// @route delete api/post/:id
// @desc GET Post by id
// @access Private
router.delete(
    '/:id',
    passport.authenticate('jwt', { session: false }),
    (req, res) => {
        Profile.findOne({ user: req.user.id })
            .then(profile => {
                Post.findById(req.params.id)
                    .then(post => {
                        // Check for post owner
                        if (post.user.toString() !== req.user.id) {
                            return res
                                .status(401)
                                .json({ notauthorized: 'User not authorized' });
                        }
                        // Delete
                        post.remove()
                            .then(() => res.json({ success: true }))
                            .catch(err =>
                                res
                                    .status(404)
                                    .json({ postnotfound: 'No post found' })
                            );
                    })
                    .catch(err =>
                        res
                            .status(404)
                            .json({ nopostfound: 'No post found with that ID' })
                    );
            })
            .catch(err =>
                res
                    .status(404)
                    .json({ nopostfound: 'No profile found with that ID' })
            );
    }
);

// @route POST api/post/like/:id
// @desc Like Post
// @access Private
router.post(
    '/like/:id',
    passport.authenticate('jwt', { session: false }),
    (req, res) => {
        Profile.findOne({ user: req.user.id })
            .then(profile => {
                Post.findById(req.params.id)
                    .then(post => {
                        if (
                            post.likes.filter(
                                like => like.user.toString() === req.user.id
                            ).length > 0
                        ) {
                            return res.status(400).json({
                                alreadyliked: 'User already liked this post'
                            });
                        }

                        // add user to likes array
                        post.likes.unshift({ user: req.user.id });
                        post.save().then(post => res.json(post));
                    })
                    .catch(err =>
                        res
                            .status(404)
                            .json({ nopostfound: 'No post found with that ID' })
                    );
            })
            .catch(err =>
                res
                    .status(404)
                    .json({ nopostfound: 'No Profile found with that ID' })
            );
    }
);

// @route POST api/post/unlike/:id
// @desc Unlike Post
// @access Private
router.post(
    '/unlike/:id',
    passport.authenticate('jwt', { session: false }),
    (req, res) => {
        Profile.findOne({ user: req.user.id })
            .then(profile => {
                Post.findById(req.params.id)
                    .then(post => {
                        if (
                            post.likes.filter(
                                like => like.user.toString() === req.user.id
                            ).length === 0
                        ) {
                            return res.status(400).json({
                                alreadyliked: 'You have not liked this post'
                            });
                        }

                        // Get Remove Index
                        const removeIndex = post.likes
                            .map(item => item.user.toString())
                            .indexOf(req.user.id);

                        //Splice out of array
                        post.likes.splice(removeIndex, 1);

                        //Save
                        post.save().then(post => res.json(post));
                    })
                    .catch(err =>
                        res
                            .status(404)
                            .json({ nopostfound: 'No post found with that ID' })
                    );
            })
            .catch(err =>
                res
                    .status(404)
                    .json({ nopostfound: 'No Profile found with that ID' })
            );
    }
);
module.exports = router;
