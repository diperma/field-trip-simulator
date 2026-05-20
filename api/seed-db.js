import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

// ── Default MongoDB Atlas Connection String ───────────────────────────────────
const MONGODB_URI = process.env.MONGODB_URI;

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
  manualTransport: { type: Number },
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

async function runSeeder() {
  console.log("🚀 Starting MongoDB Cloud Seeder Utility...");

  if (!MONGODB_URI) {
    console.error("❌ MONGODB_URI is required. Set it in your environment before running this utility.");
    process.exit(1);
  }
  
  // Mask connection string
  const maskedUri = MONGODB_URI.replace(/:([^@]+)@/, ":*****@");
  console.log(`🔗 Connecting to database: ${maskedUri}`);

  try {
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Successfully connected to MongoDB Atlas!");

    console.log("🧹 Clearing existing assignments collection...");
    const deleteResult = await Assignment.deleteMany({});
    console.log(`🧹 Done! Removed ${deleteResult.deletedCount} documents.`);

    console.log("🌱 Inserting BPKP Triwulan II seed assignments...");
    const records = await Assignment.insertMany(seedAssignments);
    console.log(`🌱 Done! Successfully seeded ${records.length} assignments in MongoDB Atlas.`);

    console.log("\n📊 Verification Details of Seeded Documents:");
    records.forEach((rec) => {
      console.log(`   📌 Assignment No: ${rec.no}`);
      console.log(`      ID PKPT      : ${rec.pkptId}`);
      console.log(`      Lokus        : ${rec.members[0]?.province || "-"}, ${rec.members[0]?.city || "-"}`);
      console.log(`      Jumlah Tim   : ${rec.members.length} Pegawai`);
      console.log(`      Expected Total: Rp ${rec.expectedTotal.toLocaleString("id-ID")}`);
      console.log(`      Document _id : ${rec._id}`);
      console.log("      ------------------------------------");
    });

    console.log("\n🎉 Database setup and seeding completed successfully!");
  } catch (error) {
    console.error("❌ Seeding failed with error:", error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Disconnected from MongoDB Atlas.");
    process.exit(0);
  }
}

runSeeder();
