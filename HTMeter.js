const itmpnode = require('./itmpnode.js')

class HTMeter extends itmpnode {
  constructor (itmp, addr) {
    super(itmp, addr)
    const that = this
    itmp.connect(addr, '', null, () => {
      itmp.describe(addr, '', (description) => {
        that.description = description
        console.log('d description: ', JSON.stringify(description))
      })
      that.ready = true
    })
    itmp.describe(addr, '', (description) => {
      that.description = description
      if (Array.isArray(description)) {
        that.links = []
        for (let lnk of description) {
          that.links.push(lnk)
          console.log('d description: ', JSON.stringify(lnk))
        }
      }
    })
  }
  read (done, err) {
    this.call('get', null, (data) => {
      if (data[0] > 1000 || data[0] < 0) {
        this.H = NaN
        this.T = NaN
      } else {
        this.H = data[0] / 10
        this.T = data[1] / 10
      }
      done({ H: this.H, T: this.T })
    }, err)
  }
}

module.exports = HTMeter
