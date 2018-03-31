
class itmpnode {
  constructor (itmp, addr) {
    this.itmp = itmp
    this.addr = addr
  }
  describe (name, done, err) {
    return this.itmp.describe(this.addr, name, done, err)
  }
  call (name, param, done, err) {
    return this.itmp.call(this.addr, name, param, done, err)
  }
}

module.exports = itmpnode
