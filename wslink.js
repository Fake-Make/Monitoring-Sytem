const itmplink = require('./itmplink')
const WebSocket = require('ws')

class ITMPWsLink extends itmplink {
  constructor (itmp, name, path) {
    super(itmp, name, false)
    var that = this
    this.ws = new WebSocket(path) // 'ws://www.host.com/path'
    this.msgqueue = []

    this.ws.on('open', function open () {
      console.log('opened')
    })

    // Open errors will be emitted as an error event
    this.ws.on('error', function (err) {
      console.log('Error: ', err.message)
    })
    this.ws.on('message', function (message) {
      that.income(message)
    })
    this.ws.on('open', function () { // open logic
      // itmp.connect();
      that.ready = true // port opened flag
      while (that.msgqueue.length > 0) {
        var [addr, binmsg] = that.msgqueue.shift()
        that.send(addr, binmsg)
      }
    })
    this.ws.on('close', function (code, reason) {
      console.log('closed ', code, reason)
      that.ready = false
    })
  }

  income (message) {
    let addr = ''
    let msg = JSON.parse(message)
    if (typeof this.itmp.process === 'function') this.itmp.process(this, addr, msg)
  }

  send (addr, binmsg) {
    if (this.ready) {
      this.ws.send(JSON.stringify(binmsg))
    } else {
      this.msgqueue.push([addr, binmsg])
    }
  }

  queueSize (addr) {
    return this.msgqueue.length
  }
}

module.exports = ITMPWsLink
