var fs = require('fs')
var path = require('path')
var electron = require('electron')
var moment = require('moment')

var Handlebars = require('handlebars')
var sitesTpl = Handlebars.compile(fs.readFileSync(path.join(__dirname, 'sites.hbs'), 'utf8'))

Handlebars.registerHelper('statusClass', status => {
  var cls
  if (status < 200) cls = 'status-1xx'
  if (status >= 200 && status < 300) cls = 'status-2xx'
  if (status >= 300 && status < 400) cls = 'status-3xx'
  if (status >= 400 && status < 500) cls = 'status-4xx'
  if (status >= 500) cls = 'status-5xx'
  return cls
})

Handlebars.registerHelper('timestampText', timestampText)

electron.ipcRenderer
  .on('data', (event, data) => render(data))
  .on('show', startUpdateTimestampTexts)
  .on('hide', stopUpdateTimestampTexts)

function render (data) {
  data = data || {}
  document.body.innerHTML = sitesTpl({sites: data})

  addEventListener(document.querySelectorAll('a'), 'click', e => {
    e.preventDefault()
    var url = e.currentTarget.getAttribute('href')
    electron.shell.openExternal(url)
  })

  electron.ipcRenderer.send('height', document.body.clientHeight)
}

function addEventListener (nodeList, event, handler) {
  for (var i = 0; i < nodeList.length; i++) {
    nodeList[i].addEventListener(event, handler)
  }
}

var updateTimestampTextsTimeout = null

function startUpdateTimestampTexts () {
  stopUpdateTimestampTexts()

  updateTimestampTextsTimeout = setTimeout(() => {
    updateTimestampTexts()
    startUpdateTimestampTexts()
  }, 100)
}

function stopUpdateTimestampTexts () {
  clearTimeout(updateTimestampTextsTimeout)
}

function updateTimestampTexts () {
  var stamps = document.querySelectorAll('.timestamp')

  for (var i = 0; i < stamps.length; i++) {
    stamps[i].innerHTML = timestampText(stamps[i].getAttribute('data-timestamp'))
  }
}

function timestampText (stamp) {
  var duration = moment.duration(parseInt(stamp, 10) - Date.now())
  var humanized

  if (duration.asSeconds() < -59) {
    humanized = duration.humanize(true)
  } else {
    humanized = `${-Math.round(duration.asSeconds())} seconds ago`
  }

  return `Updated: ${humanized}`
}

updateTimestampTexts()
