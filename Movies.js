var mongoose = require('mongoose');
var Schema = mongoose.Schema;

try {
  mongoose.connect( process.env.DB, {useNewUrlParser: true, useUnifiedTopology: true}, () =>
      console.log("connected"));
} catch (error) {
  console.log("could not connect");
}
//mongoose.set('useCreateIndex', true);
mongoose.connect(process.env.DB);

// Movie schema
const MovieSchema = new Schema({
    title: { type: String, required: true, index: true },
    releaseDate: Date,
    genre: {
      type: String,
      enum: [
        'Action', 'Adventure', 'Comedy', 'Drama', 'Fantasy', 'Horror', 'Mystery', 'Thriller', 'Western', 'Science Fiction'
      ],
    },
    actors: [{
      actorName: String,
      characterName: String,
    }],
    imageUrl: String
  });

// return the model
module.exports = mongoose.model('Movie', MovieSchema);