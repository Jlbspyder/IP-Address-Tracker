# IP Address Tracker

A responsive app that finds the approximate location of an IP address or domain and displays it on an interactive map.

## Features

- Automatically looks up your public IP on page load.
- Searches IPv4 addresses, IPv6 addresses, and domains.
- Displays IP address, location, UTC offset, and ISP.
- Updates the map marker after each successful search.
- Supports map zooming and panning.
- Includes responsive layouts, loading messages, and error handling.

## Usage

Enter an IP address such as `8.8.8.8` or a domain such as `example.com`, then press Enter or click the arrow. Submit an empty search to look up your own IP again.

Enter domains without a protocol or path. Street addresses are not supported.

IP locations are approximate and may identify your ISP's network location rather than your physical location. VPNs and mobile networks can affect results. Missing API fields display a dash.

## Tech stack

React, TypeScript, Vite, CSS, IPify Geolocation API (Country + City), Leaflet, and OpenStreetMap tiles.

## Local setup

Install Node.js and npm, and get an [IPify Geolocation API key](https://geo.ipify.org/) with Country + City access.

1. Install dependencies:

   ```sh
   npm install
   ```

2. Create `.env` in the project root (ignored by Git):

   ```env
   IPIFY_API_KEY=your_ipify_api_key
   ```

3. Run `npm run dev:netlify` and open `http://localhost:8888`. Accept the Netlify CLI installation prompt on the first run. This runs both Vite and the server-side lookup function. Plain `npm run dev` only runs the frontend.

If you see an HTML/JSON parsing error or a missing-function message on port 5173, stop Vite with Ctrl+C, run `npm run dev:netlify`, and use port 8888. Use a complete public IP such as `8.8.8.8` to test; `876` is not a valid IP address. On localhost, the function discovers your computer's public IP through IPify when Netlify Dev reports a loopback address. On Netlify, it uses the visitor IP supplied by the platform.

## Deploy to Netlify

Connect the repository to Netlify. The included `netlify.toml` configures the build, publish directory, and functions. In Netlify's environment variables, set `IPIFY_API_KEY` with Functions scope (or all scopes), then deploy.

Alternatively, run `npx netlify-cli deploy --build --prod` from the project root after signing in. Uploading only `dist` through Netlify Drop will not deploy the function.

## API key security

The browser calls `/.netlify/functions/lookup`. Only the Netlify Function contacts IPify, using the server-side `IPIFY_API_KEY` variable. Do not use a `VITE_` prefix for secrets.

If an earlier deployment exposed your key, revoke it in IPify and generate a replacement. Remove `VITE_IPIFY_API_KEY` from Netlify and local files, set the replacement as `IPIFY_API_KEY`, and deploy this version. Old deployed bundles may still contain the revoked key.

The lookup endpoint is public. Keeping the key private does not prevent others from calling the endpoint; use Netlify rate limits or bot protection if it attracts abuse.

### Links

- Live Site URL: [https://jlb-ip-address-tracker.netlify.app/](https://jlb-ip-address-tracker.netlify.app/)


## Credits

- Geolocation: [IPify](https://geo.ipify.org/docs)
- Maps: [Leaflet](https://leafletjs.com/)
- Map data: [OpenStreetMap contributors](https://www.openstreetmap.org/copyright)
