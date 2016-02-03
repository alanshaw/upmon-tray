var config = require('rc')('upmon', {tray: {limit: 250}})
var menubar = require('menubar')
var upmon = require('upmon')
var ndjson = require('ndjson')
var ipcMain = require('electron').ipcMain
var debounce = require('debounce')
var Icons = require('./icons')

var data = {}

upmon().pipe(ndjson.parse()).on('data', d => {
  data[d.url] = data[d.url] || []
  data[d.url].unshift(d)
  data[d.url] = data[d.url].slice(0, config.tray.limit)
  send()
  updateIcon()
})

var mb = menubar({icon: Icons.default, height: 50})

mb.on('ready', () => {
  mb.tray.setPressedImage(Icons.pressed)

  updateIcon()

  mb.on('after-create-window', () => {
    // mb.window.webContents.openDevTools()
    mb.window.webContents.on('did-finish-load', send)
  })

  mb.on('after-show', send)
})

function send () {
  if (!mb.window) return
  if (!mb.window.isVisible()) return
  mb.window.webContents.send('render', data)
}

function updateIcon () {
  if (!mb.tray) return

  var isError = Object.keys(data).some(url => {
    return data[url][0].status < 200 || data[url][0].status >= 300
  })

  mb.tray.setImage(isError ? Icons.error : Icons.default)
}

ipcMain.on('height', (event, height) => setWindowSize(400, height))

var setWindowSize = debounce((w, h) => mb.window.setSize(w, h, true), 500)
