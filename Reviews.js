var mongoose = require('mongoose');
var Schema = mongoose.Schema;

try {
  mongoose.connect( process.env.DB, {useNewUrlParser: true, useUnifiedTopology: true}, () =>
      console.log("connected"));
} catch (error) {
  console.log("could not connect");
}
mongoose.connect(process.env.DB);

// Movie schema
const ReviewSchema = new Schema({
    movieId: { type: Schema.Types.ObjectId, ref: 'Movie' },
    username: String,
    review: String,
    rating: { type: Number, min: 0, max: 5 }
  });

// return the model
module.exports = mongoose.model('Review', ReviewSchema);