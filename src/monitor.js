const fetch = require('node-fetch')
const colors = require('colors')
const path = require('path');
const directory = 'content';
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
            .setFooter('Created by @unresisting', 'https://i.imgur.com/Zxh45Hf.png')
            .setTimestamp()
        Object.keys(monitoredSites).forEach((fileName) => { // SAVES AN INITIAL VERSION OF EACH FILE'S CONTENT FOR LATER REFERENCE
            initEmbed.addField(fileName, monitoredSites[fileName])
            monitorLog('Initializing', "Initializing FileTrackr...", 'log')
            fetch(monitoredSites[fileName]) // GET THE FILE CONTENT
                .then(resp => resp.text())
                .then(content => {
                    //  fs.writeFile(path.join(directory, fileName), content + 'reflex is a cutie', function(err) { //  TESTING LINE TO SEE ADDED
                    fs.writeFile(path.join(directory, fileName), content, function (err) {
                        if (err) monitorLog(fileName, err, 'err');
                        monitorLog(fileName, 'Successfully pulled initial content', 'log')
                    })
                })
        })
        startMonitor()
        webhook.send(initEmbed) // SENDS WEBHOOK CONTAINING INITIALIZATION INFORMATION (LIST OF ALL FILENAME/URL REQUESTED)
            .catch(error => {
                monitorLog('Initializing', error, "err")
            })
    } else {
        monitorLog('Initializing', "Initializing FileTrackr...", 'log')
    }
}


function startMonitor() { // MONITORS CONTENT EVERY X DELAY AND ALERTS IF THERE IS A CHANGE OR NOT
    setInterval(() => {
        Object.keys(monitoredSites).forEach(fileName => {
            fetch(monitoredSites[fileName])
                .then(resp => resp.text())
                .then(content => {
                    let oldData = fs.readFileSync(path.join(directory, fileName), {
                        encoding: 'utf8'
                    })
                    if (oldData.toString() == content.toString()) {
                        monitorLog(fileName, 'File content has remained the same', 'same')
                    } else {
                        let findDiff = new Promise((resolve) => {
                            let changeArr = [" ", " "]
                            oldData.split('').forEach(function (val, i) {
                                if (val != content.charAt(i)) changeArr[0] += val; // FINDS WHAT CONTENT WAS ADDED
                            })
                            content.split('').forEach(function (val, i) {
                                if (val != oldData.charAt(i)) changeArr[1] += val; // FINDS WHAT CONTENT WAS ADDED
                            })
                            resolve(changeArr)
                        })
                        findDiff.then((changeArr) => {
                            let added = changeArr[0]
                            let removed = changeArr[1]
                            const changeEmbed = new MessageBuilder() // WEBHOOK BUILDER
                                .setTitle('FileTrackr Detected A Change!')
                                .setDescription('`A file content change has been detected.`')
                                .setColor('#000000')
                                .setImage('https://i.imgur.com/Zn5wxLF.png')
                                .addField(`${fileName}`, `${monitoredSites[fileName]}`)
                                .addField(`Added`, "`" + `${added.substring(0,process.env.charLimit)}` + "`")
                                .addField(`Removed`, "`" + `${removed.substring(0,process.env.charLimit)}` + "`")
                                .setFooter('Created by @unresisting', 'https://i.imgur.com/Zxh45Hf.png')
                                .setTimestamp()
                            let webhook = new Webhook(process.env.webhookURL);
                            webhook.send(changeEmbed)
                                .catch(error => {
                                    monitorLog('Initializing', error, "err")
                                })
                            monitorLog(fileName, 'File content changed', 'change')
                        })
                    }

                })
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
