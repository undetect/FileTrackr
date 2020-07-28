const fetch = require('node-fetch')
const colors = require('colors')
const path = require('path');
const directory = '../content';
const fs = require('fs')
const {
    Webhook,
    MessageBuilder
} = require('discord-webhook-node');
require('dotenv').config()


let monitoredSites = { // ORGANIZED BY PREFERRED FILENAME : FILE URL

    "finishline": 'https://www.finishline.com/public/5f1a9c3afno20161dd820a65a151e9a', // MONITORS FINISHLINE AKAM FILE 
    "shoepalace": 'https://www.shoepalace.com/cdn-cgi/bm/cv/1284585713/api.js' // MONITORS SHOE PALACE CLOUFFLAR FINGERPRINTING FILE

}


function initMonitor() { // SAVES ALL SITE CONTENT To INDIVIDUAL TEXT FILES
    fs.readdir(directory, (err, files) => {
        if (err) throw err;

        for (const file of files) {
            fs.unlink(path.join(directory, file), err => {
                if (err) throw err;
            });
        }
    });
    if (process.env.webhookURL != null) {
        let webhook = new Webhook(process.env.webhookURL);
        const initEmbed = new MessageBuilder() // WEBHOOK BUILDER
            .setTitle('FileTrackr Initialized')
            .setDescription('`Starting file monitoring...`')
            .setColor('#000000')
            .setImage('https://i.imgur.com/Zn5wxLF.png')
            .setFooter('Created by @retryafter', 'https://i.imgur.com/Zxh45Hf.png')
            .setTimestamp()
        Object.keys(monitoredSites).forEach((fileName) => { // SAVES AN INITIAL VERSION OF EACH FILE'S CONTENT FOR LATER REFERENCE
            initEmbed.addField(fileName, monitoredSites[fileName])
            monitorLog('Initializing', "Initializing FileTrackr...", 'log')
            fetch(monitoredSites[fileName]) // GET THE FILE CONTENT
                .then(resp => resp.text())
                .then(content => {
                    fs.writeFile(`../content/${fileName}.txt`, content, function (err) { // CREATION AND WRITING OF CONTENT FILE
                        if (err) monitorLog(fileName, err, 'err');
                        monitorLog(fileName, 'Successfully pulled initial content', 'log')
                        startMonitor()
                    })
                })
        })
        webhook.send(initEmbed) // SENDS WEBHOOK CONTAINING INITIALIZATION INFORMATION (LIST OF ALL FILENAME/URL REQUESTED)
            .catch(error => {
                monitorLog('Initializing', error, "err")
            })
    } else {
        monitorLog('Initializing', "Initializing FileTrackr...", 'log')
    }
}


function startMonitor() { // MONITORS CONTENT EVERY X DELAY AND ALERTS IF THERE IS A CHANGE OR NOT
    setTimeout(() => {
        Object.keys(monitoredSites).forEach(fileName => {
            fetch(monitoredSites[fileName])
                .then(resp => resp.text())
        })
    }, process.env.monitorDelay)
}


function monitorLog(fileName, msg, type) { // LOGGING FUNCTION THAT TAKES IN FILENAME, MESSAGE CONTENT, AND TYPE - LOGS TO CONSOLE
    switch (type) {
        case "err": // LOGS ERRORS
            console.log(`[${new Date().toLocaleDateString()}] - [${new Date().toLocaleTimeString()}] - [${fileName}] - ${msg}`.red)
            break;
        case "change": // IF FILE CONTENT CHANGES
            console.log(`[${new Date().toLocaleDateString()}] - [${new Date().toLocaleTimeString()}] - [${fileName}] - ${msg}`.yellow)
            break;
        case "same": // IF FILE CONTENT IS THE SAME
            console.log(`[${new Date().toLocaleDateString()}] - [${new Date().toLocaleTimeString()}] - [${fileName}] - ${msg}`.blue)
            break;
        case "log": // NORMAL LOGGING
            console.log(`[${new Date().toLocaleDateString()}] - [${new Date().toLocaleTimeString()}] - [${fileName}] - ${msg}`.green)
            break;
    }
}


initMonitor()