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

2. Create `.env.local` in the project root:

   ```env
   VITE_IPIFY_API_KEY=your_ipify_api_key
   ```

### Links

- Live Site URL: [https://jlb-ip-address-tracker.netlify.app/](https://jlb-ip-address-tracker.netlify.app/)


## Credits

- Geolocation: [IPify](https://geo.ipify.org/docs)
- Maps: [Leaflet](https://leafletjs.com/)
- Map data: [OpenStreetMap contributors](https://www.openstreetmap.org/copyright)
