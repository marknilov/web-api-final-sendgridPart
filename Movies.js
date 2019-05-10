var mongoose = require('mongoose');
var Schema = mongoose.Schema;
//var bcrypt = require('bcrypt-nodejs');

mongoose.Promise = global.Promise;

mongoose.connect(process.env.DB, { useNewUrlParser: true } );
mongoose.set('useCreateIndex', true);

// movies schema
var MoviesSchema = new Schema({
    title: String,
    released: Number,
    genre: {type: String, enum: ['Action', 'Adventure', 'Comedy', 'Drama', 'Fantasy', 'Horror', 'Mystery', 'Thriller', 'Western', 'Science Fiction']},
    actors: {
        type:
        [{
            actorName: String,
            charName: String
        }],
        validate: {
            validator:function(myarray) {
                return myarray.length >= 3;
            }, success: false, message: "movie must have at least 3 actors"
        }
    }
});

module.exports = mongoose.model('Movie', MoviesSchema);