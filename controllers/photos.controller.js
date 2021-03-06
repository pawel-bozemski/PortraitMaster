const Photo = require('../models/photo.model');
const Voter = require('../models/voter.model')

/****** SUBMIT PHOTO ********/

exports.add = async (req, res) => {

  try {
    const { title, author, email } = req.fields;
    const file = req.files.file;

    if(title && author && email && file) { // if fields are not empty...

      const fileName = file.path.split('/').slice(-1)[0]; // cut only filename from full path, e.g. C:/test/abc.jpg -> abc.jpg
      const fileExt = fileName.split('.').slice(-1)[0];
      const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const badStrings = /[<>%\$]/;
      if (fileExt === 'jpg' || fileExt === 'gif' || fileExt === 'png'
        && title.length < 25
        && badStrings.test(title)
        && author.length < 50
        && badStrings.test(author)
        && validEmail.test(email) ) {
        const newPhoto = new Photo({ title, author, email, src: fileName, votes: 0 });
        await newPhoto.save(); // ...save new photo in DB
        res.json(newPhoto);
      } else {
        throw new Error('Wrong file input!');
      }

    } else {
      throw new Error('Wrong input!');
    }

  } catch(err) {
    res.status(500).json(err);
  }

};

/****** LOAD ALL PHOTOS ********/

exports.loadAll = async (req, res) => {

  try {
    res.json(await Photo.find());
  } catch(err) {
    res.status(500).json(err);
  }

};

/****** VOTE FOR PHOTO ********/

exports.vote = async (req, res) => {
  try {
    const user = await Voter.findOne({ user: req.clientIp });
    if (user) {
      const newVote = await Voter.findOne({ $and: [{ user: req.clientIp, votes: req.params.id }] });

      if (!newVote) {
        await Voter.updateOne({ user: req.clientIp }, { $push: { votes: [req.params.id] } });
        const photoToUpdate = await Photo.findOne({ _id: req.params.id });
        photoToUpdate.votes++;
        photoToUpdate.save();
        res.send({ message: 'OK' });
      } else {
        res.status(500).json(err);
      }

    } else {
      const newVoter = new Voter({ user: req.clientIp, votes: [req.params.id] });
      await newVoter.save();
      const photoToUpdate = await Photo.findOne({ _id: req.params.id });
      photoToUpdate.votes++;
      photoToUpdate.save();
      res.send({ message: 'OK' });

    }
  } catch (err) {
    res.status(500).json(err);
  }};
