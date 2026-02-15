# Smart Hub - Raspberry Pi Dashboard

A lightweight React application for displaying time and weather on a Raspberry Pi 4 with 800×480 display.

## Features

- **Digital Clock**: Real-time display of current time and date
- **Weather Information**: Current temperature, conditions, and humidity
- **Optimized UI**: Designed specifically for 800×480 pixel displays
- **Lightweight**: Built with Vite for fast development and minimal bundle size
- **Auto-refresh**: Weather updates every 10 minutes

## Requirements

- Node.js 16+ (recommended: use a lightweight Node version on Raspberry Pi)
- Geolocation enabled (Weather widget requires location access)

## Installation

1. Clone the repository:
```bash
cd ~/Smart-Hub
git clone . .
```

2. Install dependencies:
```bash
npm install
```

3. Start development server:
```bash
npm run dev
```

## Running on Raspberry Pi

### Development Mode

```bash
npm run dev
```

Then access the app at `http://localhost:5173` (or the Raspberry Pi's IP address)

### Production Build

```bash
npm run build
npm run serve
```

This builds optimized assets and serves them, accessible at `http://0.0.0.0:4173`

## Raspberry Pi Setup Tips

1. **Enable Geolocation**: Make sure Chrome/Chromium allows geolocation access
2. **Autostart**: Create a systemd service to start the app on boot
3. **Kiosk Mode**: Use Chromium with `--kiosk` flag for full-screen mode
4. **Disable Screensaver**: Configure your Pi to keep the display on

## Configuration

### Weather Widget

The weather widget uses the free Open-Meteo API, which requires geolocation access. You can modify `src/components/Weather.jsx` to:
- Add a manual location configuration
- Use a different weather API (OpenWeatherMap, WeatherAPI, etc.)
- Add more weather metrics (wind speed, pressure, etc.)

## File Structure

```
smart-hub/
├── src/
│   ├── components/
│   │   ├── Clock.jsx       # Time and date display
│   │   └── Weather.jsx     # Weather information
│   ├── App.jsx             # Main app component
│   ├── App.css             # Styles optimized for 800×480
│   └── main.jsx            # React entry point
├── index.html              # HTML template
├── vite.config.js          # Vite configuration
└── package.json            # Dependencies
```

## Browser Compatibility

Works best on Chromium/Chrome, Firefox, and Webkit-based browsers with geolocation support.

## License

See LICENSE file for details.
