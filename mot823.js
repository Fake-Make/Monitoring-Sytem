const itmpnode = require('./itmpnode.js')

class mot823 extends itmpnode {
  constructor (itmp, addr) {
    super(itmp, addr)
    /* const that = this
        itmp.connect(addr,"",null,()=>{
            itmp.describe(addr,"",(description)=>{
                that.description = description;
            });
            that.ready = true;

        });
        itmp.describe(addr,"",(description)=>{
            that.description = description;
            if (Array.isArray(description)) {
                that.links = [];
                for(let lnk of description) {
                    that.links.push(lnk);
                  }
            }
        }); */
    this.pins = {
      l: {
        type: 'number',
        label: 'left position',
        units: 'ticks',
        poll: ['pos']
      },
      r: {
        type: 'number',
        label: 'right position',
        units: 'ticks',
        poll: ['pos']
      },
      t: {
        hidden: true
      },
      d: {},
      b: {},
      v: {
        type: 'number',
        label: 'input volatge',
        units: 'V',
        poll: ['stat']
      }
    }
  }
  processstatus (data, done) {
    this.leftpos = data.readInt32LE(0)
    this.rightpos = data.readInt32LE(4)
    this.lastread = data.readUInt32LE(8)
    let dist = data.readInt32LE(12)
    if (dist >= 100500) {
      this.bumper = true
      dist -= 100500
    } else {
      this.bumper = false
    }
    this.distance = dist
    if (typeof done === 'function') {
      done({
        l: this.leftpos,
        r: this.rightpos,
        t: this.lastread,
        d: this.distance,
        b: this.bumper
      })
    }
  }
  goto (left, right, speed, acc, speedright, accright) {
    let param
    switch (arguments.length) {
      case 2:
        param = Buffer.allocUnsafe(8)
        param.writeInt32LE(left, 0)
        param.writeInt32LE(right, 4)
        break
      case 3:
        param = Buffer.allocUnsafe(12)
        param.writeInt32LE(left, 0)
        param.writeInt32LE(right, 4)
        param.writeInt32LE(speed, 8)
        break
      case 4:
        param = Buffer.allocUnsafe(16)
        param.writeInt32LE(left, 0)
        param.writeInt32LE(right, 4)
        param.writeInt32LE(speed, 8)
        param.writeInt32LE(acc, 12)
        break
      case 6:
        param = Buffer.allocUnsafe(24)
        param.writeInt32LE(left, 0)
        param.writeInt32LE(right, 4)
        param.writeInt32LE(speed, 8)
        param.writeInt32LE(acc, 12)
        param.writeInt32LE(speedright, 16)
        param.writeInt32LE(accright, 20)
        break
      default:
        throw new Error('illegal argument count')
    }
    const that = this
    this.itmp.call(this.addr, 'to', param, (data) => {
      that.processstatus(data)
    })
  }
  setspeed (left, right, acc, accright) {
    let param
    switch (arguments.length) {
      case 2:
        param = Buffer.allocUnsafe(8)
        param.writeInt32LE(left, 0)
        param.writeInt32LE(right, 4)
        break
      case 3:
        param = Buffer.allocUnsafe(12)
        param.writeInt32LE(left, 0)
        param.writeInt32LE(right, 4)
        param.writeInt32LE(acc, 8)
        break
      case 4:
        param = Buffer.allocUnsafe(16)
        param.writeInt32LE(left, 0)
        param.writeInt32LE(right, 4)
        param.writeInt32LE(acc, 8)
        param.writeInt32LE(accright, 12)
        break
      default:
        throw new Error('illegal argument count')
    }
    const that = this
    this.itmp.call(this.addr, 'sp', param, (data) => {
      that.processstatus(data)
    })
  }
  setpower (left, right) {
    const param = Buffer.allocUnsafe(4)
    param.writeInt16LE(left, 0)
    param.writeInt16LE(right, 2)
    const that = this
    if (this.itmp.queueSize(this.addr) < 1) {

    }
    this.itmp.call(this.addr, 'go', param, (data) => {
      that.processstatus(data)
    })
  }
  setservo (first, second) {
    const param = Buffer.allocUnsafe(4)
    param.writeInt16LE(first, 0)
    param.writeInt16LE(second, 2)
    this.itmp.call(this.addr, 'set', param)
  }
  stat (done, err) {
    this.itmp.call(
      this.addr,
      'stat',
      null,
      (data) => {
        done({ v: data.readInt16LE(0) / 1000, flag: data[2] })
      },
      err
    )
  }
  pos (done, err) {
    const that = this
    this.itmp.call(
      this.addr,
      'to',
      null,
      (data) => {
        that.processstatus(data, done)
      },
      err
    )
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

module.exports = mot823
