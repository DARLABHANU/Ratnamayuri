const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);

const mongoose = require('mongoose');

async function test() {
  const uri = "mongodb+srv://bhanuusr:Q7TS2QiesqiD7na9@cluster0.nji8mab.mongodb.net/ratnamayuri";
  console.log("Testing connection with custom DNS...");
  try {
    const conn = await mongoose.connect(uri, { family: 4 });
    console.log("CONNECTED OK:", conn.connection.host);
    process.exit(0);
  } catch (err) {
    console.error("FAIL:", err);
    process.exit(1);
  }
}

test();
