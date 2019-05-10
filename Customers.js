var mongoose = require('mongoose');
var Schema = mongoose.Schema;

mongoose.Promise = global.Promise;

mongoose.connect(process.env.DB, { useNewUrlParser: true } );
mongoose.set('useCreateIndex', true);

var CustomerSchema = new Schema({
    email:{type:String, required: true, unique: true},
    address: String,
    sendDirect: Boolean
});


module.exports = mongoose.model('Customer', CustomerSchema);