const express = require('express');
const {
    getUserProfileCache,
    DEFAULT_PROVIDER,
    SUPPORTED_PROVIDERS,
    WEB_V2_EXPERIMENTAL_PROVIDER
} = require("../utils/malody");
const {renderDefaultCard} = require("../cards/default");

function isValidUid(uid) {
    return /^[0-9]+$/.test(uid || '');
}

function sendError(res, status, message) {
    res.status(status).send({
        code: status,
        message
    });
}

function resolveProvider(queryProvider, fallbackProvider = DEFAULT_PROVIDER) {
    if (!queryProvider) return fallbackProvider;
    if (!SUPPORTED_PROVIDERS.includes(queryProvider)) {
        throw new Error(`Unsupported provider: ${queryProvider}`);
    }
    return queryProvider;
}

function applyProviderHeaders(res, profile) {
    const provider = profile.provider || DEFAULT_PROVIDER;
    res.setHeader('X-Malody-Provider', provider);
    if (profile.experimental) {
        res.setHeader('X-Malody-Experimental', 'true');
    }
}

function createRouter(deps = {}) {
    const router = express.Router();
    const loadUserProfile = deps.getUserProfileCache || getUserProfileCache;
    const renderCard = deps.renderDefaultCard || renderDefaultCard;

    async function handleProfileRequest(req, res, providerOverride) {
        const uid = req.query.uid;
        if (!isValidUid(uid)) {
            sendError(res, 400, "Invalid uid");
            return;
        }
        try {
            const provider = providerOverride || resolveProvider(req.query.provider);
            const profile = await loadUserProfile(uid, {provider});
            applyProviderHeaders(res, profile);
            res.send({
                code: 0,
                message: "ok",
                data: profile
            });
        } catch (e) {
            const statusCode = e.message.startsWith('Unsupported provider:') ? 400 : 500;
            sendError(res, statusCode, e.message);
        }
    }

    async function handleCardRequest(req, res, providerOverride) {
        const uid = req.params.uid;

        const hide = req.query.hide ? req.query.hide.split(',').map(Number).filter(i => {
            if (isNaN(i)) return false;
            return i >= 0 && i <= 9;
        }) : [];

        if (!isValidUid(uid)) {
            sendError(res, 400, "Invalid id");
            return;
        }

        try {
            const provider = providerOverride || resolveProvider(req.query.provider);
            const profile = await loadUserProfile(uid, {provider});
            res.setHeader('Content-Type', 'image/svg+xml');
            res.setHeader('X-Cache', profile.cached ? 'HIT' : 'MISS');
            applyProviderHeaders(res, profile);
            res.status(200).send(await renderCard(profile.profile, hide));
        } catch (e) {
            const statusCode = e.message.startsWith('Unsupported provider:') ? 400 : 500;
            sendError(res, statusCode, e.message);
        }
    }

    // Redirect to github
    router.get('/', function (req, res, next) {
        res.redirect('https://github.com/vvbbnn00/malody-stats-card');
    });

    // Get user profile
    router.get('/profile', async function (req, res, next) {
        return handleProfileRequest(req, res);
    });

    // Get user profile card
    router.get('/card/default/:uid', async function (req, res, next) {
        return handleCardRequest(req, res);
    });

    router.get('/experimental/profile', async function (req, res, next) {
        return handleProfileRequest(req, res, WEB_V2_EXPERIMENTAL_PROVIDER);
    });

    router.get('/experimental/card/default/:uid', async function (req, res, next) {
        return handleCardRequest(req, res, WEB_V2_EXPERIMENTAL_PROVIDER);
    });

    return router;
}

module.exports = {
    createRouter,
    router: createRouter()
};
