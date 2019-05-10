var mongoose = require('mongoose');
var Schema = mongoose.Schema;
//var bcrypt = require('bcrypt-nodejs');

mongoose.Promise = global.Promise;

mongoose.connect(process.env.DB, { useNewUrlParser: true } );
mongoose.set('useCreateIndex', true);

// movies schema
var ReviewSchema = new Schema({
    user: String,
    movie: String,
    review: String,
    stars: Number
});

module.exports = mongoose.model('Review', ReviewSchema);