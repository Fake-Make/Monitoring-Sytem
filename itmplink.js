class itmplink {
  constructor (itmp, name, addressable) {
    this.linkname = name
    this.addressable = addressable
    this.itmp = itmp

    this.subscriptions = new Map() // map url to object
  }
}

module.exports = itmplink
