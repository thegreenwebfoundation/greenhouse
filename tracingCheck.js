const util = require("util")
const fs = require("fs")
const axios = require("axios")
const traceroute = require("traceroute")
const geoip = require("geoip-lite")
const parseArgs = require("minimist")

const writo = util.promisify(fs.writeFile)
const traco = util.promisify(traceroute.trace)

const main = async () => {
  let argv = require("minimist")(process.argv.slice(2))
  domain = argv._[0]
  if (argv._.length === 0) {
    console.log(`No domain found! Exiting early.`)
    process.exitCode = 1
  } else {
    console.log(`starting a traceroute for ${domain}`)
    let valo = await traco(domain)
    console.log("done traceroute:")
    console.log(valo)
    let validHops = valo.filter(val => {
      if (val) {
        return val
      }
    })
    let justTheIPs = validHops
      .map(v => {
        return Object.keys(v)[0]
      })
      .filter(ip => ip)

    console.log("starting lookups")
    let places = justTheIPs
      .map(ip => {
        return geoip.lookup(ip)
      })
      .filter(ip => {
        if (ip) {
          return ip
        }
      })

    console.log(places)

    console.log("done lookups, writing results")
    const res = await writo(`${domain}-latlngs.json`, JSON.stringify(places))
  }
}
main()
