import express from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import os from 'os'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = process.env.PORT || 3000

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads')
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true })
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir)
  },
  filename: (req, file, cb) => {
    // Keep original filename with timestamp to avoid conflicts
    const timestamp = Date.now()
    const ext = path.extname(file.originalname)
    const name = path.basename(file.originalname, ext)
    cb(null, `${name}-${timestamp}${ext}`)
  }
})

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  fileFilter: (req, file, cb) => {
    // Only allow image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true)
    } else {
      cb(new Error('Only image files are allowed'), false)
    }
  }
})

// Middleware
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Serve static files (React app and upload page)
app.use(express.static(path.join(__dirname, 'dist')))
app.use(express.static(path.join(__dirname, 'public')))

// Get device IP address endpoint
app.get('/api/device-ip', (req, res) => {
  // Get the actual IP address from the request headers or socket
  let ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress
  
  // If it's a local request, try to get the server's local IP
  if (!ip || ip.includes('127.0.0.1') || ip.includes('localhost') || ip.includes('::1')) {
    // Get local IP from os module
    const interfaces = os.networkInterfaces()
    
    // Find the first IPv4 address that isn't localhost
    for (const name of Object.keys(interfaces)) {
      for (const iface of interfaces[name]) {
        // Skip internal and non-IPv4 addresses
        if (iface.family === 'IPv4' && !iface.internal) {
          ip = iface.address
          break
        }
      }
      if (ip && !ip.includes('127.0.0.1') && !ip.includes('localhost')) {
        break
      }
    }
  }
  
  // Clean up IPv6 format if needed
  ip = ip.replace('::ffff:', '')
  
  res.json({ ip: ip || 'localhost' })
})

// Upload endpoint
app.post('/api/upload', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' })
  }

  res.json({
    success: true,
    message: 'Image uploaded successfully',
    filename: req.file.filename,
    originalName: req.file.originalname
  })
})

// Get all uploaded images
app.get('/api/images', (req, res) => {
  try {
    const files = fs.readdirSync(uploadsDir)
    const images = files
      .filter((file) => {
        const ext = path.extname(file).toLowerCase()
        return ['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext)
      })
      .map((file) => ({
        id: file,
        name: file,
        url: `/uploads/${file}`,
        uploadedAt: new Date(
          fs.statSync(path.join(uploadsDir, file)).mtime
        ).toISOString()
      }))

    res.json(images)
  } catch (err) {
    console.error('Error reading images:', err)
    res.status(500).json({ error: 'Failed to read images' })
  }
})

// Delete image endpoint
app.delete('/api/images/:id', (req, res) => {
  try {
    const filePath = path.join(uploadsDir, req.params.id)

    // Security: ensure the file is within uploads directory
    if (!filePath.startsWith(uploadsDir)) {
      return res.status(403).json({ error: 'Access denied' })
    }

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath)
      res.json({ success: true, message: 'Image deleted' })
    } else {
      res.status(404).json({ error: 'Image not found' })
    }
  } catch (err) {
    console.error('Error deleting image:', err)
    res.status(500).json({ error: 'Failed to delete image' })
  }
})

// Clear all images endpoint
app.delete('/api/images', (req, res) => {
  try {
    const files = fs.readdirSync(uploadsDir)
    let deletedCount = 0

    files.forEach((file) => {
      const filePath = path.join(uploadsDir, file)
      const ext = path.extname(file).toLowerCase()

      if (['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext)) {
        fs.unlinkSync(filePath)
        deletedCount++
      }
    })

    res.json({ success: true, message: `Deleted ${deletedCount} images` })
  } catch (err) {
    console.error('Error clearing images:', err)
    res.status(500).json({ error: 'Failed to clear images' })
  }
})

// Serve uploads directory
app.use('/uploads', express.static(uploadsDir))

// Fallback to React app for SPA routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'))
})

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Smart Hub server running at http://0.0.0.0:${PORT}`)
  console.log(`Upload page available at http://0.0.0.0:${PORT}/upload.html`)
})
