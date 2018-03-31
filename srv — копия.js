const fs = require('fs')
const SerialPort = require('serialport')
const ITMP = require('./ITMP.js')
const ITMPSerialLink = require('./seriallink')
const ITMPWsLink = require('./wslink.js')
const ITMPWsServer = require('./ITMPWsServer.js')
const itmpnode = require('./itmpnode.js')
// const mot823 = require('./mot823.js');
// const HTMeter = require("./HTMeter.js");

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

// Create application/x-www-form-urlencoded parser
const urlencodedParser = bodyParser.urlencoded({ extended: false })
// app.use(bodyParser.json())

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

/* app.get('/index.htm', function (req, res) {
  res.sendFile( __dirname + "/" + "index.htm" );
}) */

app.get('/process_get', (req, res) => {
  // Prepare output in JSON format
  let response = {
    first_name: req.query.first_name,
    last_name: req.query.last_name
  }
  console.log(response)
  res.end(JSON.stringify(response))
})

app.post('/process_post', urlencodedParser, (req, res) => {
  // Prepare output in JSON format
  let response = {
    first_name: req.body.first_name,
    last_name: req.body.last_name
  }
  console.log(response)
  res.end(JSON.stringify(response))
})

SerialPort.list((err, ports) => {
  if (err) { return }
  ports.forEach((port) => {
    console.log(port.comName + JSON.stringify(port))
    // console.log(port.manufacturer);
  })
})

function sleep (ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

const itmp = new ITMP()

itmp.addCall('links', (args) => {
  const ret = []
  for (const lnk of itmp.links.keys()) {
    ret.push(lnk)
  }
  return ret
})

connectors['itmp'] = itmp

let lastCPU

var stattimer
var statcount = 0
itmp.addSubscribe('stat', (args, opts, s) => {
  if (statcount === 0) {
    stattimer = setInterval(
      () => {
      // const cp = os.cpus()
        lastCPU = process.cpuUsage(lastCPU)
        itmp.emitEvent('stat', {
          H: 11, // rootArea.getChild('office').get('H'),
          T: 22 // rootArea.getChild('office').get('T')
        //        mem: ht.T
        //        freemem: os.freemem(),
        //        up: os.uptime(),
        //        usage: lastCPU
        })
      },
      1000,
      args
    )
  }
  statcount++
}, (args, opts, s) => {
  statcount--
  if (statcount <= 0) {
    stattimer = clearInterval(stattimer)
    statcount = 0 // in case of overunsubscription
  }
})

itmp.addLink(new ITMPSerialLink(itmp, 'com', 'COM7'))
// itmp.addLink(new ITMPWsLink(itmp, 'ws', 'ws://localhost:8080/mws?login=admin&password=admin'));
// itmp.addLink(new ITMPWsLink(itmp, 'wsloop', 'ws://localhost:3000/ws?login=admin&password=admin'));

// const ht = new HTMeter(itmp, 'com/6'); //mot823

let log = new Log('log')

log.write(2, 'start')

function getNode (name) {
  let path = name.split('/')
  if (path.length < 2 || path[0] !== '') { return undefined }
  let area_ = rootArea
  for (let i = 1; i < path.length; i++) {
    if (area_) {
      area_ = area_.getChild(path[i])
    }
  }
  return area_
}

app.get('/areas', (req, res) => {
  // Prepare output in JSON format
  let areaid = req.query.id
  let area_ = rootArea
  let response = []
  if (areaid === '#') {
    areaid = ''
  } else {
    area_ = getNode(areaid)
  }
  // areaid = areaid.substring(1)
  if (area_) {
    if (area_ instanceof Area) {
      area_.devs.forEach((value, key, map) => {
        let v = {'id': areaid + '/' + key, 'text': key, /* 'icon': 'device.png', */ type: (value instanceof Area) ? 'area' : 'device', 'children': true}

        response.push(v) // = { name: dev, devtype: value.devtype, connector: value.connector, key: value.addr }
      })
      area_.variables.forEach((vl, key, map) => {
        if (typeof vl !== 'function') {
          let v = {'id': areaid + '/' + key, 'text': key, data: vl, 'icon': 'value.png', 'children': false}
          if (vl.store) {
            v.text += '/hist'
          }
          response.push(v) // = { name: dev, devtype: value.devtype, connector: value.connector, key: value.addr }
        }
      })
      area_.storedtriggers.forEach((val, key, map) => {
        let v = {'id': areaid + '/' + key, 'text': key, /* 'icon': 'trigger.png', */ 'type': 'trigger', 'children': false} // source: this.storedtriggers[key]
        response.push(v)
      })
    } else if (area_ instanceof itmpnode) {
      if (area_.pins instanceof Object) {
        Object.keys(area_.pins).forEach((key) => {
          let v = {'id': areaid + '/' + key, 'text': key, 'type': 'pin', 'children': false}
          response.push(v) // = { name: dev, devtype: value.devtype, connector: value.connector, key: value.addr }
        })
      }
    }
  }
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(response))
})

app.get('/selectNode', urlencodedParser, (req, res) => {
  let response = {}
  let path = req.query.id.split('/')
  let area_ = rootArea
  for (let i = 1; i < path.length - 1; i++) {
    if (area_) {
      area_ = area_.getChild(path[i])
    }
  }
  if (area_ instanceof Area) {
    let v = area_.variables.get(path[path.length - 1])
    if (v instanceof Object) {
      response = v
      response.value = area_.get(path[path.length - 1])
    } else {
      let d = area_.devs.get(path[path.length - 1])
      if (d) {
        response.pins = d.pins
        response.devtype = d.devtype
        response.connector = d.connector
        response.addr = d.addr
      } else {
        response = area_.storedtriggers.get(path[path.length - 1])
      }
    }
  } else if (area_ instanceof itmpnode) {
    let p = area_.pins[path[path.length - 1]]
    if (p instanceof Object) {
      response = p
      response.type = 'pin'
    }
  }
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(response))
})

app.post('/renameNode', urlencodedParser, (req, res) => {
  console.log('rename', JSON.stringify(req.body))
  let path = req.body.id.split('/')
  let area_ = rootArea
  for (let i = 1; i < path.length - 1; i++) {
    if (area_) {
      area_ = area_.getChild(path[i])
    }
  }
  if (area_ instanceof Area) {
    area_.renameChild(path[path.length - 1], req.body.text)
  }
})

app.post('/deleteNode', urlencodedParser, (req, res) => {
  console.log('delete', JSON.stringify(req.body))
  let path = req.body.id.split('/')
  let area_ = rootArea
  for (let i = 1; i < path.length - 1; i++) {
    if (area_) {
      area_ = area_.getChild(path[i])
    }
  }
  let response = {result: false}
  if (area_ instanceof Area) {
    response.result = area_.deleteChild(path[path.length - 1])
  }
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(response))
})

app.post('/createNode', urlencodedParser, (req, res) => {
  console.log('create', JSON.stringify(req.body))
  let path = req.body.id.split('/')
  console.log('path ', path)
  let area_ = rootArea
  for (let i = 1; i < path.length - 1; i++) {
    if (area_) {
      area_ = area_.getChild(path[i])
    }
  }
  switch (req.body.type) {
    case 'trigger':
      if (area_ instanceof Area) { area_.on(path[path.length - 1], path[path.length - 1], '()=>{}') } // function body will be rewrited
      break
    case 'area':
    case 'folder':
      if (area_ instanceof Area) { area_.addArea(new Area(path[path.length - 1])) }

      break
    case 'device':
      if (area_ instanceof Area) { area_.addNode(path[path.length - 1], '', '', '') }// conname, type, key
      break
    case 'variable':
      if (area_ instanceof Area) { area_.addVar(path[path.length - 1], null) }// varname, defval
  }
})

rootArea = new Area('root')
rootArea.deserializecfg('cfg.json')
// let cab = new Area('cabinet', connectors, tsdb)
// cab.addNode('dev', 'mot823', 'itmp')
// rootArea.addArea(cab)
app.get('/api/update', urlencodedParser, (req, res) => {
  if (req.query.token === 'qwertyuioplkjhgf') {
    let response = {}
    let path = req.query.id.split('/')
    let area_ = rootArea
    for (let i = 1; i < path.length - 1; i++) {
      if (area_) {
        area_ = area_.getChild(path[i])
      }
    }
    if (area_ instanceof Area) {
      response = area_.update(path[path.length - 1], req.query.val)
    }
    console.log(response)
    res.setHeader('Content-Type', 'application/json')
    res.setHeader('X-itmp', 'simple')
    res.end(JSON.stringify(response))
  } else {
    res.setHeader('Content-Type', 'application/json')
    res.setHeader('X-itmp', 'simple')
    res.end(JSON.stringify({error: 'wrong token'}))
  }
})

// h.addNode("HT", "HTMeter", 'com/6', 2000);
// h.addNode("mot", "mot823", 'com/1');
// h.setHistory('HT_H', "HT/H", true);
// h.setHistory('HT_T', "HT/T", true);

// h.on(['HT_H', 'HT_T'], () => { if (HT_T < 0) alert = true; console.log("знач ", HT_H, HT_T); });
// h.on('HT_T', () => { if (HT_T < 26) HT.setservo(0,0); else HT.setservo(10,10); });

// rootArea.serializecfg('cfg.json')

async function demo () {
  //    m.describe('to',(descr)=>{ console.log("to done: ",descr); }, (err)=>{console.log("to error: ",err); } );
  // await sleep(500);
  //    m.describe('go',(descr)=>{ console.log("go done: ",descr); }, (err)=>{console.log("go error: ",err); } );

  //    itmp.describe("ws","go",(descr)=>{ console.log("ws done: ",descr); }, (err)=>{console.log("ws error: ",err); } );

  // itmp.subscribe("ws","item", {"id":1,"slot":""}, (name,data)=>{ console.log("ws event: ",name,JSON.stringify(data)); }, (err)=>{console.log("ws event error: ",err); } );

  // itmp.subscribe("ws","items/*", {}, (name,data)=>{ console.log("ws1 event: ",name,JSON.stringify(data)); }, (err)=>{console.log("ws1 event error: ",err); } );
  // itmp.subscribe("ws","items/2/time", {limit:10}, (name,data)=>{ console.log("ws2 event: ",name,JSON.stringify(data)); }, (err)=>{console.log("ws2 event error: ",err); } );

  itmp.on('event', (addr, url, data, opt) => {
    console.log('event: ', addr, url, JSON.stringify(data), typeof opt === 'undefined' ? '' : opt)
  })
  // await sleep(1500);

  // itmp.unsubscribe("ws","items/2/time", {}, (data)=>{ console.log("ws2 unsevent: ", JSON.stringify(data)); }, (err)=>{console.log("ws2 unsevent error: ",err); } );

  // const inter = setInterval(poll, 2000, ht);
}

demo()
