const fs = require('fs')
const cbor = require('cbor')

class tsdb {
  constructor (dbname) {
    this.MAX_LENGTH = 64 // chunk size
    this.series = new Map() // series in memory
    this.files = new Map() // opened files for series
    this.dbname = dbname
    this.flushtimer = setInterval(() => { this.flush() }, 4000)
  }
  write (seriesname, value, timestamp) {
    if (!timestamp) timestamp = Date.now()
    let ts = this.series.get(seriesname)
    if (ts === undefined) {
      ts = {
        tsname: seriesname,
        timestamps: [],
        values: [],
        lasttimestamp: 0,
        notwritten: 0 // element which is not written yet

      }
      this.series.set(seriesname, ts)
    }
    if (timestamp <= ts.lasttimestamp) {
      throw (new Error('wrong timestamp'))
    }
    // if (ts.values.length >= this.MAX_LENGTH){

    // }
    ts.values.push(value)
    ts.timestamps.push(timestamp)
  }
  select (seriesnames, from, to) {
    if (!Array.isArray(seriesnames)) {
      seriesnames = [seriesnames]
    }
    for (let i = 0; i < seriesnames.length; i++) {
      let Ts = this.series.get(seriesnames[i])
      if (Ts === undefined) {
        Ts = new Ts(seriesnames[i])
        this.series.set(seriesnames[i], Ts)
      }
      if (from <= Ts.lasttimestamp) {
        throw (new Error('wrong timestamp'))
      }
    }

    let cursor = null
    return cursor
  }
  cursorread (cursor, elementsnumber) { }

  flush () {
    this.series.forEach((ts, key, map) => {
      // let e=new cbor.Encoder();
      // let f=fs.createWriteStream(`tsdb/${this.dbname}_${key}.db`,{flags:"a"});
      // let tf = fs.createWriteStream(`tsdb/${this.dbname}_${key}.txt`, { flags: "a" });
      let encb = []
      // e.pipe(f);
      // let enc = new cbor.Encoder();
      for (let i = ts.notwritten; i < ts.timestamps.length; i++) {
        encb.push(cbor.encode(ts.timestamps[i]))
        encb.push(cbor.encode(ts.values[i]))

        //        e.write(ts.timestamps[i]);
        //        e.write(ts.values[i]);
        // tf.write(`${ts.timestamps[i]},${ts.values[i]}\r\n`);
      }
      let totlen = 0
      for (let i = 0; i < encb.length; i++) {
        totlen += encb[i].length
      }
      let wbuf = Buffer.alloc(totlen)
      let offset = 0
      for (let i = 0; i < encb.length; i++) {
        encb[i].copy(wbuf, offset)
        offset += encb[i].length
      }
      fs.appendFileSync(`tsdb/${this.dbname}_${key}.db`, wbuf)
      // f.close();
      // tf.close();
    })
  }
}

module.exports = tsdb
