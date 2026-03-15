/**
 * ═══════════════════════════════════════════════════════
 * VESTRA – ClothingItem Model (ClothingItem.js)
 * Mongoose schema for wardrobe clothing items.
 * ═══════════════════════════════════════════════════════
 */

const mongoose = require('mongoose');

const ClothingItemSchema = new mongoose.Schema(
  {
    // Owner
    user: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: true,
      index:    true,
    },

    // Basic Info
    name: {
      type:      String,
      required:  [true, 'Item name is required'],
      trim:      true,
      minlength: [1, 'Name must not be empty'],
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },

    category: {
      type:     String,
      required: [true, 'Category is required'],
      enum: {
        values:  ['shirt', 'pants', 'jacket', 'dress', 'shoes', 'accessory', 'sweater', 'other'],
        message: '{VALUE} is not a valid category',
      },
      lowercase: true,
    },

    color: {
      type:     String,
      required: [true, 'Color is required'],
      enum: {
        values: [
          'black', 'white', 'gray', 'red', 'blue', 'green',
          'yellow', 'pink', 'purple', 'brown', 'orange', 'beige', 'multicolor',
        ],
        message: '{VALUE} is not a valid color',
      },
      lowercase: true,
    },

    season: {
      type:     String,
      default:  'all',
      enum: {
        values:  ['spring', 'summer', 'autumn', 'winter', 'all'],
        message: '{VALUE} is not a valid season',
      },
      lowercase: true,
    },

    occasion: {
      type:     String,
      default:  'casual',
      enum: {
        values:  ['casual', 'formal', 'sport', 'party', 'work', 'beach'],
        message: '{VALUE} is not a valid occasion',
      },
      lowercase: true,
    },

    // Optional notes / brand description
    notes: {
      type:      String,
      trim:      true,
      maxlength: [500, 'Notes cannot exceed 500 characters'],
      default:   '',
    },

    // Image stored as a relative path on disk (uploads/)
    imageUrl: {
      type:    String,
      default: null,
    },

    // Soft delete flag
    deleted: {
      type:    Boolean,
      default: false,
      index:   true,
    },
  },
  {
    timestamps: true,
  }
);

/* ─── INDEX: speed up per-user wardrobe queries ─── */
ClothingItemSchema.index({ user: 1, deleted: 1, createdAt: -1 });

/* ─── VIRTUAL: formatted category label ─── */
ClothingItemSchema.virtual('categoryLabel').get(function () {
  const labels = {
    shirt:     'Shirt / T-Shirt',
    pants:     'Pants / Jeans',
    jacket:    'Jacket / Coat',
    dress:     'Dress / Skirt',
    shoes:     'Shoes',
    accessory: 'Accessory',
    sweater:   'Sweater / Hoodie',
    other:     'Other',
  };
  return labels[this.category] || this.category;
});

module.exports = mongoose.model('ClothingItem', ClothingItemSchema);
