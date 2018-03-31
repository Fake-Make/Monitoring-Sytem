const itmpnode = require('./itmpnode.js')

class SHEAD extends itmpnode {
  constructor (itmp, addr) {
    super(itmp, addr)
    itmp.connect(addr, '', null, () => {
      itmp.describe(addr, '', (description) => {
        this.description = description
      })
      this.ready = true
    })
    itmp.describe(addr, '', (description) => {
      this.description = description
      if (Array.isArray(description)) {
        this.links = []
        for (const lnk of description) {
          this.links.push(lnk)
        }
      }
    })
  }
  processstatus (data, done) {
    this.cur = data[0]
    this.target = data[1]
    this.sp = data[2]

    if (typeof done === 'function') {
      done({ cur: this.cur, target: this.target, sp: this.sp })
    }
  }
  call (name, param, done, err) {
    this.itmp.call(this.addr, name, param, done, err)
  }
  stat (id, done, err) {
    this.itmp.call(
      this.addr,
      id,
      null,
      (data) => {
        done({ cur: data[0], target: data[1], sp: data[2] })
      },
      err
    )
  }
  goto (id, pos, sp, done) {
    this.itmp.call(this.addr, id, [pos, sp], (data) => {
      this.processstatus(data, done)
    })
  }
}

/*
const EventEmitter = require('events');

class MyEmitter extends EventEmitter {}

const myEmitter = new MyEmitter();
myEmitter.on('event', () => {
  console.log('an event occurred!');
});
myEmitter.emit('event');
*/

module.exports = SHEAD
