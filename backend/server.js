const express = require("express");
const { MongoClient } = require("mongodb");
const cors = require("cors");

const app = express();
const PORT = 5038;

app.use(cors());
app.use(express.json());

const CONNECTION_STRING = "mongodb+srv://u1804054:u1804054@cluster0.gpnyllc.mongodb.net/?retryWrites=true&w=majority";
const DATABASE_NAME = 'SE';
const COLLECTION_NAME = 'agriculture';

let database;
let usersCollection;

async function connectToDatabase() {
    try {
        const client = new MongoClient(CONNECTION_STRING, {});
        await client.connect();
        database = client.db(DATABASE_NAME);
        usersCollection = database.collection(COLLECTION_NAME);
        console.log("MongoDB connection successful");
        app.listen(PORT, () => {
            console.log(`Server is listening on port ${PORT}`);
        });
    } catch (error) {
        console.error("Error connecting to MongoDB:", error);
        process.exit(1);
    }
}

connectToDatabase();

// Add a route for the root URL
// app.get('/', (req, res) => {
//     res.send('Hello, this is the root of the server!');
// });

// Agriculture route
// app.get('/api/agriculture', async (req, res) => {
//     try {
//         const collection = database.collection(COLLECTION_NAME);
//         const data = await collection.find({}).toArray();
//         res.json(data);
//     } catch (error) {
//         console.error("Error retrieving data from MongoDB:", error);
//         res.status(500).json({ error: "Internal Server Error" });
//     }
// });

app.post('/api/signup', async (req, res) => {
    try {
        console.log('Received SignUp Request:', req.body);
        const { username, email, password } = req.body;

        if (!username || !email || !password) {
            console.error('Invalid request parameters');
            return res.status(400).json({ message: 'Invalid request parameters' });
        }

        const result = await usersCollection.insertOne({ username, email, password });

        console.log('Insert Result:', result);

        if (result && result.insertedCount === 1) {
            console.log('User created successfully');
            return res.status(201).json({ message: 'User created successfully' });
        } else {
            console.error('Error inserting user into MongoDB');
            return res.status(500).json({ message: 'Error inserting user into MongoDB' });
        }
    } catch (error) {
        console.error('Error processing signup request:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
});



// SignIn endpoint
app.post('/api/signin', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await usersCollection.findOne({ email, password });

        if (user) {
            // Generate JWT and send it to the client
            // Implement JWT creation logic here
            res.status(200).json({ message: 'SignIn successful', token: 'your_generated_jwt_token' });
        } else {
            res.status(401).json({ message: 'Invalid credentials' });
        }
    } catch (error) {
        console.error('Error processing signin request:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// UserProfile endpoint
app.get('/api/userprofile', async (req, res) => {
    try {
        const { username, email } = req.query;

        if (username || email) {
            // If specific parameters are provided, return basic user profile information
            const user = await usersCollection.findOne({ $or: [{ username }, { email }] });

            if (user) {
                res.status(200).json(user);
            } else {
                res.status(404).json({ message: 'User not found' });
            }
        } else {
            // If no specific parameters are provided, return complete user profile information
            const allUsers = await usersCollection.find({}).toArray();
            res.status(200).json(allUsers);
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
});



process.on('SIGINT', () => {
    console.log('Received SIGINT. Closing MongoDB connection and exiting gracefully.');
    database && database.client.close();
    process.exit(0);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});

process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    process.exit(1);
});
