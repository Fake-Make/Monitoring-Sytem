const fs = require('fs')

class Log {
  constructor (logname) {
    this.logname = logname
    this.unsavedlog = []
    this.flushtimer = setInterval(() => { this.flush() }, 4000)
  }
  write (level, message) {
    this.unsavedlog.push({level: level, message: message})
  }

  flush () {
    let savenum = this.unsavedlog.length
    for (let i = 0; i < savenum; i++) {
      fs.appendFileSync(`tsdb/${this.logname}.log`, JSON.stringify(this.unsavedlog[i]))
    }
    this.unsavedlog.splice(0, savenum)
  }
}

module.exports = Log
