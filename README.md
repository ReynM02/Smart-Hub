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

### Autostart on Boot (Raspberry Pi OS 64-bit Trixie)

To automatically start the Smart Hub on boot, create a systemd service file.

#### Step 1: Create a systemd service file

Create a new service file:
```bash
sudo nano /etc/systemd/system/smart-hub.service
```

#### Step 2: Add the following content

Replace `/home/pi` with your actual home directory path if different:

```ini
[Unit]
Description=Smart Hub - Weather and Time Display
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=pi
WorkingDirectory=/home/pi/Smart-Hub
Environment="PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin"
ExecStart=/usr/bin/npm run serve
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
```

#### Step 3: Enable and start the service

```bash
sudo systemctl daemon-reload
sudo systemctl enable smart-hub.service
sudo systemctl start smart-hub.service
```

#### Step 4: Verify the service is running

```bash
sudo systemctl status smart-hub.service
```

#### Step 5: View logs (if needed)

```bash
sudo journalctl -u smart-hub.service -f
```

### Auto-Launch Browser in Kiosk Mode

To automatically open the dashboard in fullscreen Chromium on boot:

#### Step 1: Create an autostart entry

```bash
mkdir -p ~/.config/autostart
nano ~/.config/autostart/smart-hub-browser.desktop
```

#### Step 2: Add the following content

```ini
[Desktop Entry]
Type=Application
Name=Smart Hub Browser
Comment=Open Smart Hub in fullscreen
Exec=chromium-browser --noerrdialogs --disable-infobars --kiosk http://localhost:4173
AutoStart=true
X-GNOME-Autostart-enabled=true
```

### Additional Configuration

1. **Disable Screensaver**: Edit `/etc/lightdm/lightdm.conf` and add:
   ```
   xserver-command=X -s 0 -dpms
   ```

2. **Enable Geolocation in Chromium**: Add this to your systemd service or use a chromium policy file at `/etc/chromium-browser/policies/managed/policy.json`

3. **Network Configuration**: Use `nmtui` to configure WiFi if not already set up

### Terminal-Only Boot (Headless/Embedded Setup)

If you prefer a cleaner embedded experience booting directly to terminal without the full desktop:

#### Prerequisites

Install minimal X11 and Chromium:
```bash
sudo apt update
sudo apt install -y xserver-xorg-core xinit chromium-browser
```

#### Create a Terminal Boot Script

Create `/home/pi/start-smart-hub.sh`:

```bash
#!/bin/bash

# Wait for network to be available
sleep 5

# Start X server with Chromium in the background
startx -- /usr/bin/chromium-browser \
  --noerrdialogs \
  --disable-infobars \
  --kiosk \
  http://localhost:4173 &

# Start the Node server
cd /home/pi/Smart-Hub
npm run serve
```

Make it executable:
```bash
chmod +x /home/pi/start-smart-hub.sh
```

#### Update systemd Service

Modify the service file at `/etc/systemd/system/smart-hub.service`:

```ini
[Unit]
Description=Smart Hub - Weather and Time Display
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=pi
ExecStart=/home/pi/start-smart-hub.sh
Restart=on-failure
RestartSec=10
Environment="DISPLAY=:0"
Environment="XAUTHORITY=/home/pi/.Xauthority"

[Install]
WantedBy=multi-user.target
```

Then reload and restart:
```bash
sudo systemctl daemon-reload
sudo systemctl restart smart-hub.service
```

### Raspberry Pi OS Lite Considerations

**Pros:**
- Significantly smaller OS footprint (~1GB vs ~3-4GB for full OS)
- Faster boot times
- Lower RAM usage (core services only)
- Ideal for embedded/kiosk applications
- Better performance on Raspberry Pi 4 with limited resources

**Cons:**
- Requires manual installation of X11 and Chromium
- No built-in desktop environment utilities
- Steeper learning curve for troubleshooting

#### Installation Steps for Lite

1. **Flash latest Raspberry Pi OS Lite (Trixie 64-bit)**
   - Use Raspberry Pi Imager with SSH enabled

2. **Install essentials:**
   ```bash
   sudo apt update
   sudo apt install -y \
     curl \
     gnupg \
     ca-certificates \
     python3 \
     git
   ```

3. **Install Node.js (lightweight version):**
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt install -y nodejs
   ```

4. **Install X11 and Chromium (minimal):**
   ```bash
   sudo apt install -y xserver-xorg-core xinit chromium-browser
   ```

5. **Configure auto-login:**
   ```bash
   sudo raspi-config
   # System Options > Boot / Auto Login > Console Autologin
   ```

6. **Add startup script to .bashrc:**
   ```bash
   echo '/home/pi/start-smart-hub.sh' >> ~/.bashrc
   ```

**Project Impact:**
The React application itself is completely unaffected by the OS choice. The project will run identically on both setups—only the underlying system differs. The Node server and browser rendering remain unchanged.

### Troubleshooting

- **Service won't start**: Check logs with `sudo journalctl -u smart-hub.service -n 50`
- **Port 4173 already in use**: Modify the port in `vite.config.js`
- **Browser won't open**: Ensure X11 is running and DISPLAY is set correctly (`echo $DISPLAY` should show `:0`)
- **Geolocation denied**: Add `--allow-running-insecure-content` flag to Chromium launch command
- **"Cannot open display" error**: X server isn't running; check with `ps aux | grep X`

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
