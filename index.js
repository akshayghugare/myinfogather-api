require("dotenv").config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const bcrypt = require('bcryptjs');
const User = require('./src/models/UserModel'); // Assuming the user schema is in a separate file

const app = express();
app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname, 'build')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

console.log("process.env.MONGODB_URI",process.env.MONGODB_URI)
// MongoDB connection
mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log(err));


 //upload profile pic
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, 'uploads/'); // Make sure this uploads directory exists
  },
  filename: function(req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const fileFilter = (req, file, cb) => {
  // Accept images only
  if (!file.originalname.match(/\.(jpg|JPG|jpeg|JPEG|png|PNG|gif|GIF)$/)) {
    req.fileValidationError = 'Only image files are allowed!';
    return cb(new Error('Only image files are allowed!'), false);
  }
  cb(null, true);
};

const upload = multer({ storage: storage, fileFilter: fileFilter }).single('profilePic');

// Signup Endpoint
app.post('/signup', async (req, res) => {
  try {
    const { email, phoneNumber, password } = req.body;

    if (!(email || phoneNumber) || !password) {
      return res.status(400).json({ message: 'Email/Phone number and password are required.' });
    }

    const userExists = await User.findOne({ $or: [{ email }, { phoneNumber }] });

    if (userExists) {
      return res.status(400).json({ message: 'User already exists with the given email/phone number.' });
    }

    const newUser = new User(req.body);
    await newUser.save();

    res.status(201).json({ message: 'User created successfully', user: newUser });
  } catch (error) {
    res.status(500).json({ message: 'Error creating user', error });
  }
});

// Login Endpoint
app.post('/login', async (req, res) => {
  try {
    const { login, password } = req.body; // login can be either email or phone number
    const user = await User.findOne({ $or: [{ email: login }, { phoneNumber: login }] });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    res.status(200).json({ message: 'Login successful', user });
  } catch (error) {
    res.status(500).json({ message: 'Error logging in', error });
  }
});

//Add user
app.post('/adduser', upload, async (req, res) => {
  try {
    const { email, phoneNumber, userAddedFrom } = req.body;

    if (!(email || phoneNumber)) {
      return res.status(400).json({ message: 'Email/Phone number are required.' });
    }

    const userExists = await User.findOne({ $or: [{ email }, { phoneNumber }] });

    if (userExists) {
      return res.status(400).json({ message: 'User already exists.' });
    }

    let newUser = new User({
      ...req.body,
      profilePic: req.file ? req.file.path : '',
      userAddedFrom: userAddedFrom ? userAddedFrom : null, // Set userAddedFrom if provided
    });

    await newUser.save();

    res.status(201).json({ message: 'User created successfully', user: newUser });
  } catch (error) {
    res.status(500).json({ message: 'Error creating user', error });
  }
});


//get all user
app.get('/getAllUsers', async (req, res) => {
  try {
    const users = await User.find({});
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching users', error });
  }
});

//get by user id
app.post('/getUser/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById({_id:id});
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json({ message: 'User get successfully', user });
  } catch (error) {
    res.status(500).json({ message: 'Error get user details', error });
  }

});

// Edit User Details Endpoint
app.post('/editUser/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    if (updates.password) {
      updates.password = await bcrypt.hash(updates.password, 10);
    }

    const user = await User.findByIdAndUpdate(id, updates, { new: true });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({ message: 'User updated successfully', user });
  } catch (error) {
    res.status(500).json({ message: 'Error updating user details', error });
  }
});

app.get('/test', (req, res) => {
  res.send("Hello from API");
});

app.get('/*', (req, res) => {
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
  });

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
