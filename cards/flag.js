const fs = require('fs');
const path = require('path');
const FLAG_PATH = path.join(__dirname, 'images/flags');

FLAG_MAP = {
    // ???
    "0": {
        svg: "unknown.svg",
        name: "Unknown"
    },
    // Asia
    "1": {
        svg: "unknown.svg",
        name: "Asia"
    },
    // Africa
    "2": {
        svg: "unknown.svg",
        name: "Africa"
    },
    // North America
    "3": {
        svg: "unknown.svg",
        name: "North America"
    },
    // South America
    "4": {
        svg: "unknown.svg",
        name: "South America"
    },
    // Europe
    "5": {
        svg: "unknown.svg",
        name: "Europe"
    },
    // Australia
    "6": {
        svg: "au.svg",
        name: "Australia"
    },
    // Japan
    "7": {
        svg: "jp.svg",
        name: "Japan"
    },
    // China
    "8": {
        svg: "cn.svg",
        name: "China"
    },
    // United States
    "9": {
        svg: "us.svg",
        name: "United States"
    },
    // Taiwan
    "10": {
        svg: "tw.svg",
        name: "Taiwan"
    },
    // Korea
    "11": {
        svg: "kr.svg",
        name: "Korea"
    },
    // Germany
    "12": {
        svg: "de.svg",
        name: "Germany"
    },
    // Russian Federation
    "13": {
        svg: "ru.svg",
        name: "Russian Federation"
    },
    // Poland
    "14": {
        svg: "pl.svg",
        name: "Poland"
    },
    // France
    "15": {
        svg: "fr.svg",
        name: "France"
    },
    // Hong Kong
    "16": {
        svg: "hk.svg",
        name: "Hong Kong"
    },
    // Canada
    "17": {
        svg: "ca.svg",
        name: "Canada"
    },
    // Chile
    "18": {
        svg: "cl.svg",
        name: "Chile"
    },
    // Indonesia
    "19": {
        svg: "id.svg",
        name: "Indonesia"
    },
    // Brazil
    "20": {
        svg: "br.svg",
        name: "Brazil"
    },
    // Thailand
    "21": {
        svg: "th.svg",
        name: "Thailand"
    },
    // Italy
    "22": {
        svg: "it.svg",
        name: "Italy"
    },
    // United Kingdom
    "23": {
        svg: "gb.svg",
        name: "United Kingdom"
    },
    // Argentina
    "24": {
        svg: "ar.svg",
        name: "Argentina"
    },
    // Philippines
    "25": {
        svg: "ph.svg",
        name: "Philippines"
    },
    // Finland
    "26": {
        svg: "fi.svg",
        name: "Finland"
    },
    // Netherlands
    "27": {
        svg: "nl.svg",
        name: "Netherlands"
    },
    // Malaysia
    "28": {
        svg: "my.svg",
        name: "Malaysia"
    },
    // Spain
    "29": {
        svg: "es.svg",
        name: "Spain"
    },
    // Mexico
    "30": {
        svg: "mx.svg",
        name: "Mexico"
    },
    // Sweden
    "31": {
        svg: "se.svg",
        name: "Sweden"
    },
    // Singapore
    "32": {
        svg: "sg.svg",
        name: "Singapore"
    },
    // New Zealand
    "33": {
        svg: "nz.svg",
        name: "New Zealand"
    },
    // Vietnam
    "34": {
        svg: "vn.svg",
        name: "Vietnam"
    },
    // Belgium
    "35": {
        svg: "be.svg",
        name: "Belgium"
    },
    // Switzerland
    "36": {
        svg: "ch.svg",
        name: "Switzerland"
    },
    // Austria
    "37": {
        svg: "at.svg",
        name: "Austria"
    },
    // Bulgaria
    "38": {
        svg: "bg.svg",
        name: "Bulgaria"
    },
    // Macau
    "39": {
        svg: "mo.svg",
        name: "Macau"
    },
}

function getFlagSvg(nationNumber) {
    nationNumber = nationNumber.toString();
    if (nationNumber in FLAG_MAP) {
        return {
            svg: fs.readFileSync(path.join(FLAG_PATH, FLAG_MAP[nationNumber].svg), 'utf-8'),
            name: FLAG_MAP[nationNumber].name
        }
    }
    return {
        svg: fs.readFileSync(path.join(FLAG_PATH, FLAG_MAP[0].svg), 'utf-8'),
        name: FLAG_MAP[0].name
    }
}

module.exports = {
    getFlagSvg
}
