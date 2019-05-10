var mongoose = require('mongoose');
var Schema = mongoose.Schema;
mongoose.Promise = global.Promise;

mongoose.connect(process.env.DB, { useNewUrlParser: true } );
mongoose.set('useCreateIndex', true);


var MemeSchema =new Schema({
    url: {type:String},
    userEmail:{type:String}
});

module.exports = mongoose.model('Meme', MemeSchema);