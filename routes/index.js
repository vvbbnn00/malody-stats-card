const express = require('express');
const {getUserProfileCache} = require("../utils/malody");
const router = express.Router();

router.get('/profile', async function (req, res, next) {
    const uid = req.query.uid;
    if (!/[0-9]+/.test(uid)) {
        res.status(400).send({
            code: 400,
            message: "Invalid uid"
        });
        return;
    }
    try {
        getUserProfileCache(uid).then(profile => {
            res.send({
                code: 0,
                message: "ok",
                data: profile
            });
        });
    } catch (e) {
        res.status(500).send({
            code: 500,
            message: e.message
        });
    }
});

router.get('/card/default/:id', async function (req, res, next) {
    const id = req.params.id;
    if (!/[0-9]+/.test(id)) {
        res.status(400).send({
            code: 400,
            message: "Invalid id"
        });
        return;
    }
    try {
        res.status(200).send(await getCard(id));
    } catch (e) {
        res.status(500).send({
            code: 500,
            message: e.message
        });
    }
});

module.exports = router;
