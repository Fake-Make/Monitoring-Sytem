const EventEmitter = require('events')

class ITMP extends EventEmitter {
  constructor (portname, props) {
    super()
    this.links = new Map()
    this.tr = new Map()
  }

  addLink (lnk) {
    this.links.set(lnk.linkname, lnk)
  }

  process (link, addr, msg) {
  let [command, ...payload] = msg
  let id
  [id, ...payload] = payload

  let t = this.tr.get(addr)
  if (t && typeof t.done === 'function')
    t.done(payload)
}

  transaction (addr, msg, done, err) {
    const [linkname, subaddr = ''] = addr.split('/', 2)
    const link = this.links.get(linkname)
    link.send(subaddr, msg, done, err);
    this.tr.set(addr,{done,err})
  }

  call (addr, name, param, done, err) {
    return this.transaction(addr, [8, 0, name, [param]], done, err)
  }

  addCall (name, func) {
    this.urls.set(name, { call: func })
  }
}

module.exports = ITMP