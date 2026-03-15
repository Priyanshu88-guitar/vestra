/**
 * ═══════════════════════════════════════════════════════
 * VESTRA – Wardrobe Routes (wardrobe.routes.js)
 * All routes are protected (require valid JWT).
 *
 * GET    /api/wardrobe          – List all items for user
 * GET    /api/wardrobe/:id      – Get single item
 * POST   /api/wardrobe          – Add new clothing item (multipart)
 * PATCH  /api/wardrobe/:id      – Update item metadata
 * DELETE /api/wardrobe/:id      – Delete item (soft delete)
 * ═══════════════════════════════════════════════════════
 */

const express      = require('express');
const multer       = require('multer');
const path         = require('path');
const fs           = require('fs');
const sharp        = require('sharp');
const ClothingItem = require('../models/ClothingItem');
const User         = require('../models/User');
const { protect }  = require('../middleware/auth.middleware');

const router = express.Router();

// All wardrobe routes require auth
router.use(protect);

/* ═══════════════════════════════════════════════════════
   MULTER CONFIGURATION — File Upload Storage
   ═══════════════════════════════════════════════════════ */
const UPLOADS_DIR = path.join(__dirname, '../../uploads');

// Ensure uploads directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Store each user's images in a subfolder
    const userDir = path.join(UPLOADS_DIR, req.user._id.toString());
    if (!fs.existsSync(userDir)) {
      fs.mkdirSync(userDir, { recursive: true });
    }
    cb(null, userDir);
  },
  filename: (req, file, cb) => {
    // Generate unique timestamped filename
    const ext      = path.extname(file.originalname).toLowerCase() || '.jpg';
    const filename = `item_${Date.now()}_${Math.random().toString(36).slice(2, 8)}${ext}`;
    cb(null, filename);
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only JPEG, PNG, WebP, and GIF images are allowed.'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
});

/* ═══════════════════════════════════════════════════════
   GET /api/wardrobe
   Returns all non-deleted items for the authenticated user,
   sorted by newest first.
   ═══════════════════════════════════════════════════════ */
router.get('/', async (req, res) => {
  try {
    const {
      category, color, season, occasion,
      page = 1, limit = 100,
      search,
    } = req.query;

    // Build filter
    const filter = {
      user:    req.user._id,
      deleted: false,
    };

    if (category) filter.category = category;
    if (color)    filter.color    = color;
    if (season)   filter.season   = season;
    if (occasion) filter.occasion = occasion;

    // Simple text search on name/notes
    if (search) {
      filter.$or = [
        { name:  { $regex: search, $options: 'i' } },
        { notes: { $regex: search, $options: 'i' } },
      ];
    }

    const skip  = (parseInt(page) - 1) * parseInt(limit);
    const items = await ClothingItem
      .find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.json(items);

  } catch (err) {
    console.error('[Wardrobe] GET / error:', err);
    res.status(500).json({ message: 'Failed to fetch wardrobe.' });
  }
});

/* ═══════════════════════════════════════════════════════
   GET /api/wardrobe/:id
   Returns a single clothing item by ID.
   ═══════════════════════════════════════════════════════ */
router.get('/:id', async (req, res) => {
  try {
    const item = await ClothingItem.findOne({
      _id:     req.params.id,
      user:    req.user._id,
      deleted: false,
    });

    if (!item) {
      return res.status(404).json({ message: 'Item not found.' });
    }

    res.json(item);

  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid item ID.' });
    }
    res.status(500).json({ message: 'Failed to fetch item.' });
  }
});

/* ═══════════════════════════════════════════════════════
   POST /api/wardrobe
   Upload a new clothing item with optional image.
   Accepts: multipart/form-data
   Fields: name, category, color, season, occasion, notes
   File:   image (optional)
   ═══════════════════════════════════════════════════════ */
router.post('/', upload.single('image'), async (req, res) => {
  try {
    const { name, category, color, season, occasion, notes } = req.body;

    // Validate required fields
    if (!name || !category || !color) {
      // Clean up uploaded file if validation fails
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(400).json({
        message: 'Name, category, and color are required.',
      });
    }

    let imageUrl = null;

    // Process uploaded image with sharp (resize + optimise)
    if (req.file) {
      try {
        const inputPath  = req.file.path;
        const outputName = `opt_${path.basename(req.file.path, path.extname(req.file.path))}.webp`;
        const outputPath = path.join(path.dirname(inputPath), outputName);

        await sharp(inputPath)
          .resize(800, 1000, { fit: 'inside', withoutEnlargement: true })
          .webp({ quality: 85 })
          .toFile(outputPath);

        // Remove the original uploaded file
        fs.unlinkSync(inputPath);

        // Store relative URL path
        imageUrl = `uploads/${req.user._id}/${outputName}`;

      } catch (sharpErr) {
        // If sharp fails, fall back to original file
        console.warn('[Upload] Image optimisation failed, using original:', sharpErr.message);
        imageUrl = `uploads/${req.user._id}/${req.file.filename}`;
      }
    }

    // Create the clothing item document
    const item = await ClothingItem.create({
      user:     req.user._id,
      name:     name.trim(),
      category: category.toLowerCase(),
      color:    color.toLowerCase(),
      season:   season || 'all',
      occasion: occasion || 'casual',
      notes:    notes || '',
      imageUrl,
    });

    // Increment user's wardrobe count
    await User.findByIdAndUpdate(req.user._id, { $inc: { wardrobeCount: 1 } });

    res.status(201).json(item);

  } catch (err) {
    // Clean up file if DB creation failed
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(e => e.message).join(', ');
      return res.status(400).json({ message: messages });
    }

    console.error('[Wardrobe] POST / error:', err);
    res.status(500).json({ message: 'Failed to save clothing item.' });
  }
});

/* ═══════════════════════════════════════════════════════
   PATCH /api/wardrobe/:id
   Update clothing item fields (not the image).
   Body: { name?, category?, color?, season?, occasion?, notes? }
   ═══════════════════════════════════════════════════════ */
router.patch('/:id', async (req, res) => {
  try {
    const allowedUpdates = ['name', 'category', 'color', 'season', 'occasion', 'notes'];
    const updates = {};
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: 'No valid fields to update.' });
    }

    const item = await ClothingItem.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id, deleted: false },
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!item) {
      return res.status(404).json({ message: 'Item not found.' });
    }

    res.json(item);

  } catch (err) {
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(e => e.message).join(', ');
      return res.status(400).json({ message: messages });
    }
    res.status(500).json({ message: 'Failed to update item.' });
  }
});

/* ═══════════════════════════════════════════════════════
   DELETE /api/wardrobe/:id
   Soft-deletes a clothing item and removes the image file.
   ═══════════════════════════════════════════════════════ */
router.delete('/:id', async (req, res) => {
  try {
    const item = await ClothingItem.findOne({
      _id:     req.params.id,
      user:    req.user._id,
      deleted: false,
    });

    if (!item) {
      return res.status(404).json({ message: 'Item not found.' });
    }

    // Remove the image file from disk
    if (item.imageUrl) {
      const fullPath = path.join(__dirname, '../../', item.imageUrl);
      if (fs.existsSync(fullPath)) {
        try {
          fs.unlinkSync(fullPath);
        } catch (fsErr) {
          console.warn('[Delete] Could not remove image file:', fsErr.message);
        }
      }
    }

    // Soft delete
    item.deleted = true;
    await item.save();

    // Decrement wardrobe count
    await User.findByIdAndUpdate(req.user._id, {
      $inc: { wardrobeCount: -1 },
    });

    res.status(204).send();

  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid item ID.' });
    }
    console.error('[Wardrobe] DELETE error:', err);
    res.status(500).json({ message: 'Failed to delete item.' });
  }
});

/* ─── MULTER ERROR HANDLER ─── */
router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'Image too large. Max size is 10MB.' });
    }
    return res.status(400).json({ message: `Upload error: ${err.message}` });
  }
  if (err.message && err.message.includes('Only JPEG')) {
    return res.status(400).json({ message: err.message });
  }
  next(err);
});

module.exports = router;
