const fs = require('fs');
const path = require('path');
const {buffer2Base64, getOnlinePicture} = require('../utils/common');
const {getFlagSvg} = require("./flag");

const template = fs.readFileSync(path.join(__dirname, 'templates/default.svg'), 'utf-8').toString();
const defaultAvatar = fs.readFileSync(path.join(__dirname, 'images/default_avatar.png'));
const defaultBg = fs.readFileSync(path.join(__dirname, 'images/default_bg.png'));
const defaultAvatarBase64 = buffer2Base64(defaultAvatar);
const bgBase64 = buffer2Base64(defaultBg);

const AVAILABLE_MODES = [0, 3, 4, 5, 6, 7, 8, 9];

function renderAvatarBgSvg(avatarBase64) {
    if (!avatarBase64) return `<image filter="url(#blur-filter)" x="-20" y="-20" width="490" href="${bgBase64}" />`;
    return `<image filter="url(#blur-filter)" x="-20" y="-295" width="490" href="${avatarBase64}" />`
}

function renderModeIcons(modeList, timeDelay = 150) {
    let result = "";
    let currentDelay = timeDelay + 50;
    let currentX = 97;
    for (let i = 0; i < modeList.length; i++) {
        if (!AVAILABLE_MODES.includes(modeList[i])) continue;
        const mode = modeList[i];
        const modeFileName = `mode-${mode}-white.png`;
        const modePng = fs.readFileSync(path.join(__dirname, 'images/modes', modeFileName));
        const modeBase64 = buffer2Base64(modePng);
        result += `<image style="animation-delay: ${currentDelay}ms" class="mode-icon" width="30" x="${currentX}" y="60" href="${modeBase64}" />`;
        currentDelay += 50;
        currentX += 33;
    }
    return {
        svg: result,
        delay: currentDelay
    }
}

function renderModeStat(statList, timeDelay = 150) {
    let result = "";
    let currentDelay = timeDelay + 50;
    // currentX 0, 150, 300
    // currentY 0, 55, 110, ...
    let currentX = 0, currentY = 0;
    for (let i = 0; i < statList.length; i++) {
        if (currentX > 300) {
            currentX = 0;
            currentY += 55;
        }
        const stat = statList[i];
        const mode = stat.mode;
        if (!AVAILABLE_MODES.includes(mode)) continue;
        const modeFileName = `mode-${mode}.png`;
        const modePng = fs.readFileSync(path.join(__dirname, 'images/modes', modeFileName));
        const modeBase64 = buffer2Base64(modePng);

        result += `<g class="mode-stat" style="animation-delay: ${currentDelay}ms" transform="translate(${currentX}, ${currentY})" >
<image width="50" href="${modeBase64}" />
<text x="55" y="20" class="rank-text">#${Number(stat.rank) || 'N/A'}</text>
<text x="55" y="33" class="rank-detail">Acc: ${stat.acc ? stat.acc.toFixed(2) : 'N/A'}%</text>
<text x="55" y="43" class="rank-detail">Played ${stat.pc || 'N/A'}</text>
</g>`
        currentDelay += 50;
        currentX += 150;
    }
    return {
        svg: result,
        delay: currentDelay,
        y: currentY,
        isEmpty: statList.length === 0
    }
}


async function renderDefaultCard(userProfile, hide=[]) {
    const {cout: countryNumber, name: username, id: uid} = userProfile.meta;
    const avatarUrl = `http://cdn1.machart.top/avatar/${uid}`;
    const avatar = await getOnlinePicture(avatarUrl);
    const avatarBase64 = buffer2Base64(avatar);
    const flagSvg = getFlagSvg(countryNumber);
    const flagSvgSource = flagSvg.svg;
    const country = flagSvg.name;
    const record = userProfile.record;
    const modes = record.map(m => m.mode);
    const modeIcons = renderModeIcons(modes);
    const modeStat = renderModeStat(record.filter(r => !hide.includes(r.mode)), modeIcons.delay);

    if (modeStat.isEmpty) {
        modeStat.y = -75;
    }

    const height = 125 + (modeStat.y / 55 + 1) * 55 + 15;
    const flagY = -53 - (modeStat.y / 55) * 27.5;

    const title = `${username}'s Malody Profile Card`;
    const description = `Malody Username: ${username} | Malody ID: ${uid} | Country: ${country} | Modes: ${modes.join(",")}`;

    return template
        .replaceAll("{{nation}}", country)
        .replaceAll("{{nation_flag}}", flagSvgSource)
        .replaceAll("{{avatar_bg}}", renderAvatarBgSvg(avatarBase64))
        .replaceAll("{{username}}", username)
        .replaceAll("{{mode_icon}}", modeIcons.svg)
        .replaceAll("{{mode_stat}}", modeStat.svg)
        .replaceAll("{{height}}", height.toString())
        .replaceAll("{{avatar}}", avatarBase64 || defaultAvatarBase64)
        .replaceAll("{{title}}", title)
        .replaceAll("{{desc}}", description)
        .replaceAll("{{flag_y}}", flagY.toFixed(0));
}

module.exports = {
    renderDefaultCard
}