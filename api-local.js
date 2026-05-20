import app from "./api/index.js";

const PORT = process.env.PORT || 5000;

app.listen(PORT, "127.0.0.1", () => {
  console.log("");
  console.log("==================================================================");
  console.log(" 🚀 BPKP Field Trip Simulator - Backend Server Running!");
  console.log(` 🔗 Local Endpoint: http://127.0.0.1:${PORT}`);
  console.log("📡 API is live and listening for database CRUD queries");
  console.log("==================================================================");
  console.log("");
});
