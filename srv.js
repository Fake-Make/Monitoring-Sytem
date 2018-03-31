const fs = require('fs')
const SerialPort = require('serialport')
const ITMP = require('./ITMP.js')
const ITMPSerialLink = require('./seriallink')
const ITMPWsLink = require('./wslink.js')
const ITMPWsServer = require('./ITMPWsServer.js')
const itmpnode = require('./itmpnode.js')
const HTMeter = require("./HTMeter.js");

const SHEAD = require('./stepmod.js')
const os = require('os')

const express = require('express')

const app = express()
const expressWs = require('express-ws')(app)
const bodyParser = require('body-parser')

const Tsdb = require('./tsdb')

var connectors = {}
var tsdb = new Tsdb('itmp')
var rootArea

exports.connectors = connectors
exports.tsdb = tsdb

const Area = require('./area')

const Log = require('./log')

const urlencodedParser = bodyParser.urlencoded({ extended: false })

app.use('/', express.static('public'))
app.ws('/ws', (ws, req) => {
  if (req.connection.remoteFamily === 'IPv6') {
    itmp.addLink(
      new ITMPWsServer(
        itmp,
        `ws:[${req.connection.remoteAddress}]:${req.connection.remotePort}`,
        ws
      )
    )
  } else {
    itmp.addLink(
      new ITMPWsServer(itmp, `ws:${req.connection.remoteAddress}:${req.connection.remotePort}`, ws)
    )
  }
  console.log(`connected ws:[${req.connection.remoteAddress}]:${req.connection.remotePort}`)
})

var server = app.listen(3000, () => {
  console.log(
    `App listening on address '${server.address().address}' and port ${server.address().port}`
  )
})

const itmp = new ITMP()

// Функция поиска последовательных портов
/*
SerialPort.list((err, ports) => {
  if (err) { return }
  ports.forEach((port) => {
    console.log(port.comName + JSON.stringify(port))
    // console.log(port.manufacturer);
  })
})
*/

itmp.addLink(new ITMPSerialLink(itmp, 'com', 'COM3'))

// Таймер, ежесекундно получающий влажность * 10 и температуру * 10 соответственно
var stattimer = setInterval(() => {
		itmp.call("com/47",
			"get",
			null,
			(data) => {console.log(JSON.stringify(data))}
			)
        },
        1000
        )
//cp2104 driver required