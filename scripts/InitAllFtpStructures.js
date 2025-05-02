const ftp = require("basic-ftp");
const db = require("../config/db");

async function ensurePath(client, fullPath) {
  const parts = fullPath.split("/").filter(Boolean);
  await client.cd("/");
  for (const part of parts) {
    try {
      await client.cd(part);
    } catch {
      await client.send("MKD " + part);
      await client.cd(part);
    }
  }
}

async function createFtpStructureForAllUsers() {
  const client = new ftp.Client();
  try {
    await client.access({
      host: "uabcs.online",
      user: "practicas@uabcs.online",
      password: "G1vNRIluN.k5",
      port: 21,
      secure: false
    });

    // STUDENTS
    const [students] = await db.query("SELECT studentID FROM Student");
    for (const s of students) {
      const base = `/practices/students/student_${s.studentID}`;
      const paths = [
        `${base}/profile`, `${base}/curriculums`, `${base}/messages`, `${base}/reports`,
        `${base}/documents/imss`, `${base}/documents/presentation_letter`, `${base}/documents/acceptance_letter`,
        `${base}/documents/commitment_letter`, `${base}/documents/termination_letter`,
        `${base}/documents/satisfaction_survey`, `${base}/documents/final_report`, `${base}/documents/others`,
        `${base}/sent_to_company`, `${base}/sent_to_assessor`
      ];
      for (const p of paths) await ensurePath(client, p);
    }

    // INTERNAL ASSESSORS
    const [internals] = await db.query("SELECT internalAssessorID FROM InternalAssessor");
    for (const i of internals) {
      const base = `/practices/internalAssessor/assessor_${i.internalAssessorID}`;
      const paths = [`${base}/documents_received`, `${base}/tracking`, `${base}/signed_reports`];
      for (const p of paths) await ensurePath(client, p);
    }

    // EXTERNAL ASSESSORS
    const [externals] = await db.query("SELECT externalAssessorID FROM ExternalAssessor");
    for (const e of externals) {
      const base = `/practices/externalAssessor/assessor_${e.externalAssessorID}`;
      const paths = [`${base}/delivered_documents`];
      for (const p of paths) await ensurePath(client, p);
    }

    // COMPANIES
    const [companies] = await db.query("SELECT companyID FROM Company");
    for (const c of companies) {
      const base = `/practices/company/company_${c.companyID}`;
      const paths = [`${base}/documents_received`, `${base}/presentation_letters`];
      for (const p of paths) await ensurePath(client, p);
    }

    // FORMATS (solo una vez)
    const formats = [
      "/practices/formats/templates",
      "/practices/formats/guides",
      "/practices/formats/general"
    ];
    for (const p of formats) await ensurePath(client, p);

    console.log("All FTP user structures created successfully.");
  } catch (err) {
    console.error("Error creating FTP structure:", err);
  } finally {
    client.close();
    process.exit();
  }
}

createFtpStructureForAllUsers();
