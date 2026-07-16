const mongoose = require('mongoose');
require('dotenv').config();

const Conversation = require('./models/Conversation');
const Message = require('./models/Message');
const Visitor = require('./models/Visitor');

async function clearDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to DB');
    
    await Conversation.deleteMany({});
    console.log('Cleared Conversations');
    
    await Message.deleteMany({});
    console.log('Cleared Messages');
    
    await Visitor.deleteMany({});
    console.log('Cleared Visitors');
    
    mongoose.disconnect();
    console.log('Done!');
  } catch(e) {
    console.error(e);
    process.exit(1);
  }
}
clearDB();
