# Smart Hub - Raspberry Pi Dashboard

A lightweight React application for displaying time, weather, and screensaver on a Raspberry Pi 4 with 800×480 display.

## Features

- **Digital Clock**: Real-time display of current time and date
- **Weather Information**: Current temperature, conditions, humidity, and 7-day forecast
- **Weather Icons**: Beautiful SVG weather icons with day/night variants
- **Screensaver Mode**: Automatic slideshow of locally-stored images after 10 minutes of inactivity
- **Web Upload Interface**: Upload images from your phone/computer to the disk at `http://pi-address:3000/upload.html`
- **Multi-page Navigation**: Click to switch between main dashboard and 7-day forecast
- **Smooth Animations**: Synchronized page transitions with fade effects
- **Optimized UI**: Designed specifically for 800×480 pixel displays
- **Lightweight**: Built with Vite for fast development and minimal bundle size
- **Auto-refresh**: Weather updates every 10 minutes with localStorage caching
- **Auto-return**: Forecast automatically returns to main dashboard after 60 seconds

## Requirements

- Node.js 16+ (recommended: use LTS version, node-v20.x)
- npm 8+
- Geolocation enabled (Weather widget requires location access)
- For Raspberry Pi: 64-bit Raspberry Pi OS (Trixie recommended)

## Installation

1. Clone or download the repository:
```bash
cd ~
git clone <repository-url> Smart-Hub
cd Smart-Hub
```

2. Install dependencies:
```bash
npm install
```

3. Build the production app:
```bash
npm run build
```

## Running Locally (Development)

### Development Mode

```bash
npm run dev
```

Access the app at `http://localhost:5173`

### Preview Mode

```bash
npm run preview
```

Access the app at `http://localhost:4173`

## Running on Raspberry Pi (Production)

### Quick Start

```bash
npm run start
```

This builds the app and starts the server on `http://0.0.0.0:3000`

### Features

- **Main Dashboard** (default): View current time and weather
- **Forecast**: Click dashboard to view 7-day forecast (auto-returns after 60 seconds)
- **Settings**: Right-click dashboard to manage settings and uploaded images
- **Screensaver**: Activates after 10 minutes of inactivity, displays image slideshow
- **Web Upload**: Access `http://<pi-ip>:3000/upload.html` from any device to upload images

### Debug Mode

To manually test the screensaver without waiting 10 minutes, edit [src/App.jsx](src/App.jsx#L9):

```javascript
const DEBUG_SCREENSAVER = true  // Set to true, then rebuild with npm run build
```

Then access the app—screensaver will activate immediately on load.

## Raspberry Pi Setup

### Step 1: Initial Setup on Raspberry Pi

1. **Flash Raspberry Pi OS 64-bit Trixie**
   - Use Raspberry Pi Imager
   - Enable SSH during setup (gear icon)
   - Set hostname, username, password

2. **Connect via SSH and update system:**
   ```bash
   ssh pi@<pi-ip>
   sudo apt update && sudo apt upgrade -y
   ```

3. **Install Node.js (LTS):**
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt install -y nodejs
   ```

4. **Verify installations:**
   ```bash
   node --version      # Should show v20.x.x
   npm --version       # Should show 10.x.x
   ```

### Step 2: Clone and Build Smart Hub

1. **Download Smart Hub:**
   ```bash
   cd ~
   git clone <repository-url> Smart-Hub
   cd Smart-Hub
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Build the app:**
   ```bash
   npm run build
   ```

### Step 3: Autostart on Boot with systemd

Create a systemd service to auto-start Smart Hub:

1. **Create service file:**
   ```bash
   sudo nano /etc/systemd/system/smart-hub.service
   ```

2. **Add the following content:**
   ```ini
   [Unit]
   Description=Smart Hub - Weather and Time Display with Screensaver
   After=network-online.target
   Wants=network-online.target

   [Service]
   Type=simple
   User=pi
   WorkingDirectory=/home/pi/Smart-Hub
   Environment="PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin"
   Environment="NODE_ENV=production"
   ExecStart=/usr/bin/npm start
   Restart=on-failure
   RestartSec=10

   [Install]
   WantedBy=multi-user.target
   ```

3. **Enable and start the service:**
   ```bash
   sudo systemctl daemon-reload
   sudo systemctl enable smart-hub.service
   sudo systemctl start smart-hub.service
   ```

4. **Verify it's running:**
   ```bash
   sudo systemctl status smart-hub.service
   ```

5. **View logs (if needed):**
   ```bash
   sudo journalctl -u smart-hub.service -f
   ```

### Step 4: Auto-Launch Browser in Kiosk Mode

To automatically display the dashboard on boot (requires X11/desktop environment):

1. **Create autostart desktop entry:**
   ```bash
   mkdir -p ~/.config/autostart
   nano ~/.config/autostart/smart-hub-browser.desktop
   ```

2. **Add this content:**
   ```ini
   [Desktop Entry]
   Type=Application
   Name=Smart Hub Browser
   Comment=Open Smart Hub in fullscreen kiosk mode
   Exec=chromium-browser --noerrdialogs --disable-infobars --kiosk http://localhost:3000
   AutoStart=true
   X-GNOME-Autostart-enabled=true
   ```

3. **Save and close**. The browser will auto-launch on next desktop login.

### Step 5: Configure Geolocation (Optional)

For Chromium to request location permission without blocking:

1. **Create Chromium policy directory:**
   ```bash
   sudo mkdir -p /etc/chromium-browser/policies/managed
   ```

2. **Create policy file:**
   ```bash
   sudo nano /etc/chromium-browser/policies/managed/smart-hub.json
   ```

3. **Add policy:**
   ```json
   {
     "DefaultGeolocationSetting": 1
   }
   ```

### Accessing from Phone/Computer

#### Upload Images from External Device

1. **Get Raspberry Pi IP:**
   ```bash
   hostname -I
   ```
   (e.g., `192.168.1.100`)

2. **Open browser on your phone/computer:**
   ```
   http://192.168.1.100:3000/upload.html
   ```

3. **Upload images** using the drag-and-drop interface

4. **Images appear** in the screensaver and Settings page automatically

#### View Dashboard Remotely

Access the main dashboard from any device:
```
http://192.168.1.100:3000
```

### Troubleshooting

**Service won't start:**
```bash
sudo journalctl -u smart-hub.service -n 50  # View recent logs
```

**Port 3000 already in use:**
- Kill the existing process: `sudo lsof -ti:3000 | xargs kill -9`
- Or change the port in `server.js` (line: `const PORT = process.env.PORT || 3000`)

**Browser won't open (Kiosk mode):**
- Ensure X11 is running: `ps aux | grep X`
- Check DISPLAY: `echo $DISPLAY` (should show `:0`)

**Geolocation denied:**
- Grant permission manually in Chromium settings
- Or add `--allow-running-insecure-content` to browser launch command

**Images don't appear in screensaver:**
- Check `~/Smart-Hub/uploads/` directory exists
- Verify images were uploaded: Visit `http://pi-ip:3000/upload.html`
- Check browser console for errors (F12)

**Service fails on reboot:**
- Ensure Node.js and npm are in PATH for the pi user
- Test manually: `cd ~/Smart-Hub && npm start`
- Check logs: `sudo systemctl status smart-hub.service`

**Cannot see web upload page:**
- Verify server is running: `sudo systemctl status smart-hub.service`
- Check firewall: `sudo ufw status` (if enabled)
- Try localhost first: `http://localhost:3000/upload.html`

## Configuration

### Weather Widget

The weather widget uses the free Open-Meteo API, which requires geolocation access. You can modify [src/components/Weather.jsx](src/components/Weather.jsx) to:
- Add manual location configuration
- Use a different weather API (OpenWeatherMap, WeatherAPI, etc.)
- Add more weather metrics (wind speed, pressure, UV index, etc.)

### Screensaver

The screensaver activates after 10 minutes of inactivity. Configure in [src/App.jsx](src/App.jsx):

```javascript
const INACTIVITY_TIMEOUT = 10 * 60 * 1000  // Change this value (in milliseconds)
```

### Image Storage

Images can be uploaded and stored in two ways:

1. **Web Upload** (`/api/upload`): Stores images in `~/Smart-Hub/uploads/` directory on the Raspberry Pi
2. **Local App Upload**: Stores images in browser's IndexedDB (persists across sessions)

Both sources are combined and displayed in the screensaver automatically.

## File Structure

```
smart-hub/
├── src/
│   ├── components/
│   │   ├── Clock.jsx           # Time and date display
│   │   ├── Weather.jsx         # Weather with icons and reverse geocoding
│   │   ├── Forecast.jsx        # 7-day weather forecast
│   │   ├── Screensaver.jsx     # Image slideshow (15s per image)
│   │   └── Settings.jsx        # Image management UI
│   ├── utils/
│   │   └── imageDatabase.js    # IndexedDB and API image storage
│   ├── App.jsx                 # Main app with page routing
│   ├── App.css                 # Styles optimized for 800×480
│   └── main.jsx                # React entry point
├── public/
│   ├── upload.html             # Web upload interface
│   └── Assets/
│       └── Icons/              # 54 weather SVG icons
├── server.js                   # Express server for production
├── package.json                # Dependencies and scripts
├── vite.config.js              # Vite bundler config
├── index.html                  # HTML template
└── README.md                   # This file
```

## Available npm Scripts

```bash
npm run dev          # Start development server (Vite, http://localhost:5173)
npm run build        # Build production bundle
npm run preview      # Preview production build locally
npm run serve        # Start preview server (http://localhost:4173)
npm run server       # Start Express server only
npm run start        # Build + start Express server (use on Raspberry Pi)
```

## Advanced Setup

### Custom Port for Express Server

Modify the port by setting the `PORT` environment variable before running:

```bash
PORT=8080 npm start
```

Or permanently edit `server.js` line 5 and change:
```javascript
const PORT = process.env.PORT || 3000
```

### Disable CORS (For Trusted Networks)

To allow uploads from external IPs, the `server.js` already serves on `0.0.0.0`. No additional CORS configuration needed.

### Remote SSH Tunneling (Optional)

If Smart Hub isn't accessible on your local network, create an SSH tunnel:

```bash
ssh -L 3000:localhost:3000 pi@<pi-ip>
```

Then access at `http://localhost:3000` on your local machine.

### Monitor Service in Real-Time

Watch the live logs while the service is running:

```bash
sudo tail -f /var/log/syslog | grep smart-hub
# Or use journalctl with follow:
sudo journalctl -u smart-hub.service -f --no-pager
```

### Backup and Restore Images

**Backup uploaded images:**
```bash
tar -czf smart-hub-backup.tar.gz ~/Smart-Hub/uploads/
```

**Restore images:**
```bash
tar -xzf smart-hub-backup.tar.gz -C ~
```

### Update Smart Hub

```bash
cd ~/Smart-Hub
git pull origin main
npm install
npm run build
sudo systemctl restart smart-hub.service
```

## Browser Compatibility

Works best on Chromium/Chrome, Firefox, and Webkit-based browsers with geolocation support.

## License

See LICENSE file for details.
