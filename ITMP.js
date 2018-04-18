const EventEmitter = require('events')

class ITMP extends EventEmitter {
  constructor (portname, props) {
    super()
    this.links = new Map()
  }

  addLink (lnk) {
    this.links.set(lnk.linkname, lnk)
  }

  process (link, addr, msg) {
  let [command, ...payload] = msg
  let id
  [id, ...payload] = payload
}

  transaction (addr, msg, dat, done, err) {
    const [linkname, subaddr = ''] = addr.split('/', 2)
    const link = this.links.get(linkname)
    link.send(subaddr, msg, dat, done, err);
  }

  call (addr, name, dat, param, done, err) {
    return this.transaction(addr, [8, 0, name, [param]], dat, done, err)
  }

  addCall (name, func) {
    this.urls.set(name, { call: func })
  }
}

module.exports = ITMP