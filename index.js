var config = require('rc')('upmon', {tray: {limit: 250}})
var menubar = require('menubar')
var upmon = require('upmon')
var ndjson = require('ndjson')
var ipcMain = require('electron').ipcMain
var debounce = require('debounce')
var Icons = require('./icons')

var data = {}

function startUpmon () {
  var pinger = upmon().on('error', restartUpmon)

  pinger
    .pipe(ndjson.parse())
    .on('data', d => {
      data[d.url] = data[d.url] || []
      data[d.url].unshift(d)
      data[d.url] = data[d.url].slice(0, config.tray.limit)
      sendData()
      updateIcon()
    })
    .on('error', restartUpmon)
}

function restartUpmon (err) {
  if (err) return console.error(err)
  setTimeout(startUpmon, 1000)
}

startUpmon()

var mb = menubar({icon: Icons.default, height: 50})

mb.on('ready', () => {
  mb.tray.setPressedImage(Icons.pressed)

  updateIcon()

  mb.on('after-create-window', () => {
    mb.window.webContents.on('did-finish-load', () => {
      // mb.window.webContents.openDevTools()
      mb.window.webContents.send('show')
      sendData()
    })
  })

  mb.on('after-show', () => {
    mb.window.webContents.send('show')
    sendData()
  })

  mb.on('after-hide', () => mb.window.webContents.send('hide'))
})

function sendData () {
  if (!mb.window) return
  if (!mb.window.isVisible()) return
  mb.window.webContents.send('data', data)
}

function updateIcon () {
  if (!mb.tray) return

  var isError = Object.keys(data).some(url => {
    return data[url][0].status < 200 || data[url][0].status >= 300
  })

  mb.tray.setImage(isError ? Icons.error : Icons.default)
}

ipcMain.on('height', (event, height) => setWindowSize(400, height))

var setWindowSize = debounce((w, h) => {
  if (h < 50) h = 50
  mb.window.setSize(w, h, true)
}, 500)
