const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
    itemNo: { type: String, required: true, unique: true },
    carType: { type: String },
    itemType: { type: String },
    itemName: { type: String, required: true }, // <-- 이름이 "itemName"
    dimensions: {
        width: { type: Number, required: true },
        depth: { type: Number, required: true },
        height: { type: Number, required: true }
    },
    weight: { type: Number, required: true }, // <-- 이름이 "weight"
    stackable: { type: Boolean, default: false },
    max_stack_count: { type: Number, default: 1 },
    rotation_allowed: [{ type: String, enum: ['x', 'y', 'z'] }],
    handling_notes: { type: String },
    incompatible_with: [{ type: String }],
    is_palletized: { type: Boolean, default: true }
});

const Item = mongoose.model('Item', itemSchema); // <-- 모델 이름이 'Item'

module.exports = Item;