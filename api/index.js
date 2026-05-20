import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// ── Default MongoDB Atlas Connection String ───────────────────────────────────
const DEFAULT_MONGODB_URI = "mongodb+srv://dipermapmp_db_user:Diperma2026!@field-trip.3wstpuh.mongodb.net/field-trip-simulator?appName=field-trip";
const MONGODB_URI = process.env.MONGODB_URI || DEFAULT_MONGODB_URI;

// ── Default BPKP Workbook Seeds ──────────────────────────────────────────────
const seedAssignments = [
  {
    no: 1,
    pkptId: 130483,
    description: "melaksanakan Uji Petik dalam rangka Evaluasi atas Tata Kelola Akses Pembiayaan UMKM Sektor Ekonomi Kreatif Triwulan II di Kota Malang",
    assignmentType: "DL",
    expectedTotal: 41546000,
    members: [
      { employeeName: "Iman Kadarman", assignmentType: "DL", province: "Jawa Timur", city: "Malang", startDate: "2026-06-02", endDate: "2026-06-04", hp: 3 },
      { employeeName: "Shinta Wayansari", assignmentType: "DL", province: "Jawa Timur", city: "Malang", startDate: "2026-06-01", endDate: "2026-06-04", hp: 4 },
      { employeeName: "Nurul Syahroni", assignmentType: "DL", province: "Jawa Timur", city: "Malang", startDate: "2026-06-01", endDate: "2026-06-04", hp: 4 },
      { employeeName: "Yoga Parasdya", assignmentType: "DL", province: "Jawa Timur", city: "Malang", startDate: "2026-06-01", endDate: "2026-06-04", hp: 4 },
      { employeeName: "Andi Muhammad Fauzan Mulawarman", assignmentType: "DL", province: "Jawa Timur", city: "Malang", startDate: "2026-06-01", endDate: "2026-06-04", hp: 4 },
    ],
  },
  {
    no: 2,
    pkptId: 129905,
    description: "melaksanakan Quality Assurance Pelaksanaan Evaluasi Tata Kelola Peningkatan Akses Pembiayaan bagi UMKM Triwulan II Tahun 2026 pada Perwakilan BPKP Provinsi Kepulauan Bangka Belitung",
    assignmentType: "DL",
    expectedTotal: 19917000,
    members: [
      { employeeName: "Willy Hutabarat", assignmentType: "DL", province: "Kep. Bangka Belitung", city: "Pangkal Pinang", startDate: "2026-06-01", endDate: "2026-06-04", hp: 4, manualTransport: 2827000 },
      { employeeName: "Miftha Adelina Mayesti", assignmentType: "DL", province: "Kep. Bangka Belitung", city: "Pangkal Pinang", startDate: "2026-06-01", endDate: "2026-06-04", hp: 4, manualTransport: 2827000 },
      { employeeName: "Wisnu Cahya Adi Wibowo", assignmentType: "DL", province: "Kep. Bangka Belitung", city: "Pangkal Pinang", startDate: "2026-06-01", endDate: "2026-06-04", hp: 4, manualTransport: 2827000 },
    ],
  },
];

// ── MongoDB Mongoose Models ───────────────────────────────────────────────────
const MemberSchema = new mongoose.Schema({
  employeeName: { type: String, required: true },
  assignmentType: { type: String, enum: ["DL", "DLDK"], required: true },
  province: { type: String, required: true },
  city: { type: String, default: "" },
  startDate: { type: String, required: true },
  endDate: { type: String, required: true },
  hp: { type: Number, required: true, min: 1 },
  manualTransport: { type: Number }, // backwards compatibility
  manualCosts: {
    dailyAllowance: { type: Number },
    lodging: { type: Number },
    transport: { type: Number },
    other: { type: Number },
  },
}, { _id: false });

const AssignmentSchema = new mongoose.Schema({
  no: { type: Number, required: true, unique: true, index: true },
  pkptId: { type: Number, default: 0 },
  description: { type: String, default: "" },
  assignmentType: { type: String, enum: ["DL", "DLDK"], default: "DL" },
  expectedTotal: { type: Number, default: 0 },
  members: [MemberSchema],
}, { timestamps: true });

const Assignment = mongoose.models.Assignment || mongoose.model("Assignment", AssignmentSchema);

// ── Database Connection Cache ─────────────────────────────────────────────────
let cachedConnection = null;
let useLocalFallback = false;
const LOCAL_DB_PATH = path.join(process.cwd(), "local-backup-db.json");

async function connectToDatabase() {
  if (useLocalFallback) {
    return null;
  }
  if (cachedConnection) {
    return cachedConnection;
  }

  try {
    const conn = await mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
    });
    cachedConnection = conn;
    console.log("☁️ Connected successfully to MongoDB Atlas Cloud");
    return conn;
  } catch (error) {
    console.warn("⚠️ MongoDB Atlas connection failed. Falling back to offline local file storage:", error.message);
    useLocalFallback = true;
    return null;
  }
}

// ── Helper functions for Local NoSQL Fallback ───────────────────────────────
function readLocalDb() {
  try {
    if (!fs.existsSync(LOCAL_DB_PATH)) {
      fs.writeFileSync(LOCAL_DB_PATH, JSON.stringify(seedAssignments, null, 2));
      return seedAssignments;
    }
    const data = fs.readFileSync(LOCAL_DB_PATH, "utf-8");
    return JSON.parse(data);
  } catch (err) {
    console.error("Failed to read local DB:", err);
    return seedAssignments;
  }
}

function writeLocalDb(data) {
  try {
    fs.writeFileSync(LOCAL_DB_PATH, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("Failed to write to local DB:", err);
  }
}

// ── REST API Router Endpoints ─────────────────────────────────────────────────

// GET Database Status Check
app.get("/api/db-status", async (req, res) => {
  await connectToDatabase();
  if (useLocalFallback) {
    res.json({
      status: "connected",
      storageType: "Local JSON File",
      details: `Saving to local disk at ${LOCAL_DB_PATH}`,
      dbName: "local-backup-db.json",
      uri: "local-file-system",
    });
  } else {
    // Mask sensitive credentials
    const maskedUri = MONGODB_URI.replace(/:([^@]+)@/, ":*****@");
    res.json({
      status: "connected",
      storageType: "MongoDB Atlas Cloud",
      details: "Connected to Atlas cluster",
      dbName: mongoose.connection.name,
      uri: maskedUri,
    });
  }
});

// GET list of all assignments
app.get("/api/assignments", async (req, res) => {
  try {
    await connectToDatabase();
    if (useLocalFallback) {
      const data = readLocalDb();
      return res.json(data);
    }

    let records = await Assignment.find().sort({ no: 1 });
    // Auto-seed if database is empty
    if (records.length === 0) {
      records = await Assignment.insertMany(seedAssignments);
    }
    res.json(records);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST a new assignment or bulk restore
app.post("/api/assignments", async (req, res) => {
  try {
    await connectToDatabase();
    const payload = req.body;

    if (useLocalFallback) {
      const db = readLocalDb();
      if (Array.isArray(payload)) {
        writeLocalDb(payload);
        return res.json(payload);
      } else {
        db.push(payload);
        writeLocalDb(db);
        return res.json(payload);
      }
    }

    if (Array.isArray(payload)) {
      // Bulk insert/overwrite
      await Assignment.deleteMany({});
      const records = await Assignment.insertMany(payload);
      return res.json(records);
    }

    const record = await Assignment.create(payload);
    res.json(record);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT (update) an existing assignment by its 'no'
app.put("/api/assignments/:no", async (req, res) => {
  try {
    await connectToDatabase();
    const no = parseInt(req.params.no, 10);

    if (useLocalFallback) {
      const db = readLocalDb();
      const idx = db.findIndex((a) => a.no === no);
      if (idx !== -1) {
        db[idx] = { ...db[idx], ...req.body, no };
        writeLocalDb(db);
        return res.json(db[idx]);
      } else {
        return res.status(404).json({ error: "Assignment not found" });
      }
    }

    const record = await Assignment.findOneAndUpdate(
      { no },
      { $set: req.body },
      { new: true, runValidators: true, upsert: true }
    );
    res.json(record);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE an assignment by its 'no'
app.delete("/api/assignments/:no", async (req, res) => {
  try {
    await connectToDatabase();
    const no = parseInt(req.params.no, 10);

    if (useLocalFallback) {
      const db = readLocalDb();
      const nextDb = db.filter((a) => a.no !== no);
      writeLocalDb(nextDb);
      return res.json({ success: true, deletedNo: no });
    }

    await Assignment.deleteOne({ no });
    res.json({ success: true, deletedNo: no });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST seed / reset database
app.post("/api/assignments/seed", async (req, res) => {
  try {
    await connectToDatabase();
    if (useLocalFallback) {
      writeLocalDb(seedAssignments);
      return res.json(seedAssignments);
    }

    await Assignment.deleteMany({});
    const records = await Assignment.insertMany(seedAssignments);
    res.json(records);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default app;
