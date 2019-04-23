# Greenhouse - Lighthouse, but for web that doesn't use fossil fuels

Lighthouse is a nice tool for helping you workout how to make a site more accessible, performance or mobile friendly.

But given climate change is a thing, what about making websites planet friendly too?

### The general plan

- Point lighthouse at a url.
- Analyse the rendered page
- See which domains in use run on renewable power, by checking against the Green Web Foundation API, or seeing what's returned at `carbon.txt`
- Compile this info into information you could present in a lighthouse run, so tools that provide lighthouse as a service can _also_ do this.

### Usage

```
node index.js https://domain.com/some-page/
```

This will generate a file, `lighthouse-check-output.json` listing all the domains, as well as whether each domain referenced in the site is green, or grey.

### Other bits that would be cool

So we know that a site we can to connect to can be green or not. But what about the hops in between?

Try this:

```
node tracingCheck.js domain.com
```

It'll create a json file, called `domain.com-latlngs.json`, showing the hops along the way, and whether they're green or grey.
