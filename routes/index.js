const express = require('express');
const {getUserProfileCache} = require("../utils/malody");
const router = express.Router();
const {renderDefaultCard} = require("../cards/default");

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

router.get('/card/default/:uid', async function (req, res, next) {
    const uid = req.params.uid;

    const hide = req.query.hide ? req.query.hide.split(',').map(Number).filter(i=>{
        if (isNaN(i)) return false;
        return i >= 0 && i <= 9;
    }) : [];

    if (!/[0-9]+/.test(uid)) {
        res.status(400).send({
            code: 400,
            message: "Invalid id"
        });
        return;
    }

    try {
        const profile = await getUserProfileCache(uid);
        // Send raw svg
        res.setHeader('Content-Type', 'image/svg+xml');
        res.setHeader('X-Cache', profile.cached ? 'HIT' : 'MISS');
        res.status(200).send(await renderDefaultCard(profile.profile, hide));
    } catch (e) {
        res.status(500).send({
            code: 500,
            message: e.message
        });
    }
});

module.exports = router;
