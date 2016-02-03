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

electron.ipcRenderer.on('render', (event, data) => render(data))

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

function updateTimestampTexts () {
  var stamps = document.querySelectorAll('.timestamp')
  for (var i = 0; i < stamps.length; i++) {
    stamps[i].innerHTML = timestampText(stamps[i].getAttribute('data-timestamp'))
  }
  setTimeout(updateTimestampTexts, 1000)
}

function timestampText (stamp) {
  var duration = moment.duration(parseInt(stamp, 10) - Date.now())

  if (duration.asSeconds() < -59) {
    return 'Updated: ' + duration.humanize(true)
  }

  return 'Updated: ' + (-duration.asSeconds().toFixed()) + ' seconds ago'
}

updateTimestampTexts()
