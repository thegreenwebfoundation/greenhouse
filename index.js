let util = require("util")
const fs = require("fs")
const url = require("url")
const axios = require("axios")
const traceroute = require("traceroute")
const geoip = require("geoip-lite")
const parseArgs = require("minimist")

const filo = util.promisify(fs.readFile)
const writo = util.promisify(fs.writeFile)

const lighthouse = require("lighthouse")
const chromeLauncher = require("chrome-launcher")

const log = require("lighthouse-logger")

const flags = { logLevel: "info" }
log.setLevel(flags.logLevel)

let argv = require("minimist")(process.argv.slice(2))
let domain = argv._[0]

if (argv._.length === 0) {
  console.log(`No domain found! Exiting early.`)
  process.exitCode = 1
} else {
  const main = async () => {
    let oop = {
      launchChromeAndRunLighthouse(url, config = null) {
        const opts = {
          chromeFlags: ["--show-paint-rects"]
        }
        return chromeLauncher
          .launch({ chromeFlags: opts.chromeFlags })
          .then(chrome => {
            opts.port = chrome.port
            return lighthouse(domain, opts, config).then(results => {
              // use results.lhr for the JS-consumeable output
              // https://github.com/GoogleChrome/lighthouse/blob/master/types/lhr.d.ts
              // use results.report for the HTML/JSON/CSV output as a string
              // use results.artifacts for the trace/screenshots/other specific case you need (rarer)
              return chrome.kill().then(() => results)
            })
          })
      },

      async fetchLightHouseResult(filePath) {
        const result = await launchChromeAndRunLighthouse(domain)

        // generated with
        // npx lighthouse --save-assets http://thegreenwebfoundation.org/
        // const stats = await filo(filePath, { encoding: "utf8" })
        // return JSON.parse(stats)
        return result
      },
      extractNetworkEvents(parsed) {
        let data = parsed.artifacts.devtoolsLogs.defaultPass.filter(entry => {
          return entry.method.includes("Network")
        })
        let reqs = {}

        data.forEach(element => {
          // console.log(element)
          if (!reqs[element.params.requestId]) {
            reqs[element.params.requestId] = {}
          }
          reqs[element.params.requestId][element.method] = element
        })
        return Object.values(reqs)
      },
      buildReqCheckObj(element) {
        // find the data for the corresponding ids
        let justtheDomain = aUrl => {
          // pull out domain somehow
          const parsedUrl = new url.URL(aUrl)
          return parsedUrl.hostname
        }

        return {
          // - size
          // size:
          //   element["Network.responseReceived"].params.response.headers[
          //     "content-length"
          //   ],
          // - domain
          domain: justtheDomain(
            element["Network.responseReceived"].params.response.url
          ),
          url: element["Network.responseReceived"].params.response.url,
          // - type of req
          type: element["Network.responseReceived"].params.type
        }
      },
      async runGreenCheck(domain) {
        const apiUrl = `http://api.thegreenwebfoundation.org/greencheck/${domain}`
        let response = await axios.get(apiUrl)
        return response
      }
      // find the size and domains
    }

    // const stats = await oop.fetchLightHouseResult(filePath)
    const stats = await oop.launchChromeAndRunLighthouse(domain)
    const reqs = oop.extractNetworkEvents(stats)

    const formattedReqs = reqs.map(req => {
      return oop.buildReqCheckObj(req)
    })
    // the spread syntax turns our deduped set into an array
    const uniqueDomains = [...new Set(formattedReqs.map(req => req.domain))]

    const greenChecks = await uniqueDomains.map(async domain => {
      return await oop.runGreenCheck(domain)
    })
    const greenCheckResults = await Promise.all(greenChecks).then(values => {
      const results = values.map(val => {
        return val.data
      })
      return results
    })
    const res = await writo(
      `lighthouse-check-output.json`,
      JSON.stringify(greenCheckResults)
    )
    console.log("DONE")
  }
  main()
}
