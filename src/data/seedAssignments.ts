import type { AssignmentInput } from "../domain/assignment";

export const seedAssignments: AssignmentInput[] = [
  {
    no: 1,
    pkptId: 130483,
    description:
      "melaksanakan Uji Petik dalam rangka Evaluasi atas Tata Kelola Akses Pembiayaan UMKM Sektor Ekonomi Kreatif Triwulan II di Kota Malang",
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
    description:
      "melaksanakan Quality Assurance Pelaksanaan Evaluasi Tata Kelola Peningkatan Akses Pembiayaan bagi UMKM Triwulan II Tahun 2026 pada Perwakilan BPKP Provinsi Kepulauan Bangka Belitung",
    assignmentType: "DL",
    expectedTotal: 19917000,
    members: [
      { employeeName: "Willy Hutabarat", assignmentType: "DL", province: "Kep. Bangka Belitung", city: "Pangkal Pinang", startDate: "2026-06-01", endDate: "2026-06-04", hp: 4, manualTransport: 2827000 },
      { employeeName: "Miftha Adelina Mayesti", assignmentType: "DL", province: "Kep. Bangka Belitung", city: "Pangkal Pinang", startDate: "2026-06-01", endDate: "2026-06-04", hp: 4, manualTransport: 2827000 },
      { employeeName: "Wisnu Cahya Adi Wibowo", assignmentType: "DL", province: "Kep. Bangka Belitung", city: "Pangkal Pinang", startDate: "2026-06-01", endDate: "2026-06-04", hp: 4, manualTransport: 2827000 },
    ],
  },
];
