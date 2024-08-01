const express = require('express'); //importiert Express
const mongoose = require('mongoose'); //importiert mongoose
const bodyParser = require('body-parser'); // importiert body-parser
const cors = require('cors'); //importiert cors 

const app = express(); //erstellt eine Instance in Express 
const port = 3001; // gebe die Portnummer an 

app.use(bodyParser.json());
app.use(cors(
    {
        origin: ["https://map-mevn.vercel.app"],
        methods: ["POST","GET"],
        credentials: true
    }
));

// MongoDB Atlas Verbindungs-URL
const dbURI = 'mongodb+srv://lukiluk:3L9s71gI5LB3uNg9@manhatten.9gey7ij.mongodb.net/?retryWrites=true&w=majority&appName=Manhatten';

mongoose.connect(dbURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('Erfolgreich mit MongoDB Atlas verbunden');
}).catch(err => {
    console.error('Fehler bei der Verbindung zu MongoDB Atlas:', err);
});

const reportSchema = new mongoose.Schema({
    type: String,
    latitude: Number,
    longitude: Number,
    createdAt: { type: Date, default: Date.now }
});

const Report = mongoose.model('Report', reportSchema);

//Neue Daten einpflegen
app.post('/api/reports', async (req, res) => {
    const { type, latitude, longitude } = req.body;
    const newReport = new Report({ type, latitude, longitude }); 

    try {
        const savedReport = await newReport.save();
        res.status(201).json(savedReport);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

//Daten zur Verfügung stellen 
app.get('/api/reports', async (req, res) => {
    try {
        const reports = await Report.find();
        res.json(reports);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

//Express Server starten
app.listen(port, () => {
    console.log(`Server läuft auf http://localhost:${port}`);
});
