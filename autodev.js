const itmpnode = require('./itmpnode.js')

class autodev extends itmpnode {
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
        type: 'number'
      }
    }
  }
}

module.exports = autodev
