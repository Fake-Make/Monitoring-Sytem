const fs = require('fs')
const vm = require('vm')

var connectors = require('./srv').connectors
var tsdb = require('./srv').tsdb
var types = new Map() // TODO: move to global
const autodev = require('./autodev')

class Area {
  constructor (areaname) {
    this.areaname = areaname
    this.devs = new Map()
    this.polls = new Map()

    this.variables = new Map()
    this.values = { console: console, setTimeout: setTimeout, 'T': 28 } // direct access from user sandboxed scripts

    this.storedtriggers = new Map()
    this.cnt = 1
    this.triggers = {}

    const that = this
    this.sandbox = new Proxy(this.values, {
      get (target, prop) {
        console.log(`Чтение ${prop}`)
        return target[prop]
      },
      set (target, prop, value) {
        if (target[prop] !== value) {
          console.log(`Изменение ${prop} ${value}`)
        } else {
          console.log(`Запись ${prop} ${value}`)
        }
        target[prop] = value

        if (that.triggers[prop]) {
          let f = that.triggers[prop]
          for (let i = 0; i < f.length; i++) {
            setTimeout(() => {
              try {
                vm.runInContext(f[i] + '()', that.sandbox)
              } catch (ex) {
                console.log('ex ' + ex)
              }
            }, 0)
          }
          // f(prop, value);
        }
        if (that.variables.has(prop)) {
          let h = that.variables.get(prop) // { varname: varname, defval: v, store: store });
          if (h.store) {
            tsdb.write(that.areaname + '_' + h.varname, value)
          }
        }
        return true
      }
    })
    vm.createContext(this.sandbox) // Contextify the sandbox.
  }
  update (name, value) {
    let ret = this.sandbox[name]
    let nv
    if (value !== undefined) {
      if ((nv = parseInt(value)) == value) {
        this.sandbox[name] = nv
      } else if ((nv = parseFloat(value)) == value) {
        this.sandbox[name] = nv
      } else {
        nv = value
        this.sandbox[name] = value
      }
    }
    return {old: ret, new: nv}
  }

  on (triggername, triggers, func) {
    // let fname = 'f' + this.cnt++
    if (!Array.isArray(triggers)) {
      triggers = triggers.split(',')
    }
    if (func instanceof Function) {
      func = func.toString()
    }
    if (typeof func !== 'string' && !(func instanceof String)) {
      return
    }
    try {
      vm.runInContext(triggername + ' = ' + func, this.sandbox)
      triggers.forEach((currentValue, index, array) => {
        if (!this.triggers[currentValue]) {
          this.triggers[currentValue] = [triggername]
        } else {
          this.triggers[currentValue].push(triggername)
        }
      })
    } catch (ex) {
      console.log(triggername + ' exc ' + ex)
    }

    // let triggersname = triggers.join()
    this.storedtriggers.set(triggername, {triggername: triggername, source: func, triggers: triggers})
    this.savecfg()
  }

  set (name, value) {
    this.sandbox[name] = value
  }
  get (name) {
    return this.sandbox[name]
  }
  setall (devname, values) {
    let names = Object.keys(values)
    for (let i = 0; i < names.length; i++) {
      this.sandbox[devname + '_' + names[i]] = values[names[i]]
    }
  }

  ex (code) {
    vm.runInContext(code, this.sandbox)
  }

  startPoll (name, period) {
    let polldev = this.devs.get(name)
    if (polldev === undefined) {
      return
    }

    let pollobject = this.polls.get(name)
    if (pollobject === undefined) {
      pollobject = {name: name, area: this, polldev: polldev, period: period}
    } else {
      if (period) {
        pollobject.period = period
      }
    }
    if (pollobject.timerId !== undefined) {
      clearInterval(pollobject.timerId)
    }
    pollobject.timerId = setInterval((po) => { po.polldev.read((data) => { po.area.setall(po.name, data) }, (err) => { /* console.error(err) */ }) }, pollobject.period, pollobject)
    this.polls.set(name, pollobject)
  }

  getChild (name) {
    return this.devs.get(name)
  }

  renameChild (name, newname) {
    if (this.devs.has(name)) {
      let n = this.devs.get(name)
      this.devs.delete(name)
      // this.values[area.areaname] = area
      delete this.values[name]
      this.devs.set(newname, n)
      this.values[newname] = n
    } else if (this.variables.has(name)) {
      let n = this.variables.get(name)
      this.variables.delete(name)
      n.varname = newname
      this.variables.set(newname, n)
    } else if (this.storedtriggers.has(name)) {
      let n = this.storedtriggers.get(name)
      this.storedtriggers.delete(name)
      n.triggername = newname
      this.storedtriggers.set(newname, n)
    }
    this.savecfg()
  }

  deleteChild (name) {
    if (this.devs.has(name)) {
      // let n = this.devs.get(name)
      this.devs.delete(name)
      delete this.values[name]
    } else if (this.variables.has(name)) {
      // let n = this.variables.get(name)
      delete this.values[name]
      this.variables.delete(name)
    } else if (this.storedtriggers.has(name)) {
      // let n = this.storedtriggers.get(name)
      this.storedtriggers.delete(name)
    } else {
      return false
    }
    this.savecfg()
    return true
  }

  addArea (area) {
    this.devs.set(area.areaname, area)
    this.values[area.areaname] = area
    area.parent = this
    this.savecfg()
  }

  savecfg () {
    if (this.parent) {
      this.parent.savecfg()
    } else if (this.loadedfile) {
      if (!this.cfgupdate) {
        this.serializecfg(this.loadedfile)
      }
    }
  }

  addNode (name, devtype, conname, key, pollinterval) {
    let Devtype
    let dev
    if (types.has(devtype)) {
      Devtype = types.get(devtype)
    } else {
      try {
        Devtype = require(`./${devtype}.js`)
      } catch (er) {
        Devtype = autodev
      }
    }
    let connector = connectors[conname]
    if (connector === undefined) {
    //  throw new Error('no such connector ' + conname)
    }
    if (Devtype) {
      dev = new Devtype(connector, key)
      dev.devtype = devtype
      dev.connector = conname
      this.devs.set(name, dev)
      this.values[name] = dev
      if (pollinterval) {
        this.startPoll(name, pollinterval)
      }
      this.savecfg()
    }
  }

  addVar (varname, defval, store) {
    if (!store) store = false
    if (this.variables.has(varname)) {
      this.variables.get(varname).defval = defval
    } else {
      this.variables.set(varname, { varname: varname, defval: defval, store: store })
    }
    this.savecfg()
  }

  serialize () {
    let cfg = {}
    cfg.devs = []

    this.devs.forEach((value, dev, map) => {
      let d
      if (value instanceof Area) {
        d = {name: value.areaname, area: value.serialize()}
      } else {
        d = { name: dev, devtype: value.devtype, connector: value.connector, key: value.addr }
        if (this.polls.has(dev)) {
          d.period = this.polls.get(dev).period
        }
      }
      cfg.devs.push(d)
    })
    cfg.vars = []
    this.variables.forEach((value, vname, map) => {
      value.varname = vname
      cfg.vars.push(value) // { varname: vname, defval: value.defval, store: value.store })
    })
    cfg.triggers = []
    this.storedtriggers.forEach((value, key, map) => {
      cfg.triggers.push({ triggername: key, triggers: value.triggers, source: value.source })
    })
    return cfg
  }

  serializecfg (path) {
    let cfg = this.serialize()

    fs.writeFile(path, JSON.stringify(cfg, null, '  '), 'utf8', (err) => {
      if (err) throw err
      console.log('The file has been saved!')
    })
  }

  deserialize (cfg) {
    try {
      for (let dev in cfg.devs) {
        try {
          if (cfg.devs[dev].area) {
            let a = new Area(cfg.devs[dev].name)
            a.deserialize(cfg.devs[dev].area)
            this.addArea(a)
          } else {
            this.addNode(cfg.devs[dev].name, cfg.devs[dev].devtype, cfg.devs[dev].connector, cfg.devs[dev].key, cfg.devs[dev].period)
          }
        } catch (err) {
          console.error(err)
        }
      }
      for (let hist in cfg.vars) {
        this.addVar(cfg.vars[hist].varname, cfg.vars[hist].defval, cfg.vars[hist].store)
      }
      for (let trig in cfg.triggers) {
        this.on(cfg.triggers[trig].triggername, cfg.triggers[trig].triggers, cfg.triggers[trig].source)
      }
    } catch (er) {

    }
  }
  deserializecfg (path) {
    this.cfgupdate = true
    try {
      let data = fs.readFileSync(path, 'utf8')

      let cfg = JSON.parse(data)
      this.deserialize(cfg)
      this.loadedfile = path
    } catch (er) {

    } finally {
      this.cfgupdate = false
    }
  }
}

module.exports = Area
