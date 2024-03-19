const mongoose = require('mongoose');

const categorySchema = mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    offer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Offer'
    },
    is_listed: {
        type: Boolean,
        default: true
    }
});

module.exports = mongoose.model('Category', categorySchema);
