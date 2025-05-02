const ftp = require("basic-ftp");
const ftpConfig = require("../config/ftpConfig");

async function createFtpStructure(userType, id) {
  const client = new ftp.Client();
  try {
    await client.access(ftpConfig);

    let base = "";
    let folders = [];

    if (userType === "student") {
      base = `/practices/students/student_${id}`;
      folders = [
        `${base}/profile`,
        `${base}/curriculums`,
        `${base}/documents/imss`,
        `${base}/documents/presentation_letter`,
        `${base}/documents/acceptance_letter`,
        `${base}/documents/commitment_letter`,
        `${base}/documents/termination_letter`,
        `${base}/documents/satisfaction_survey`,
        `${base}/documents/final_report`,
        `${base}/documents/others`,
        `${base}/messages`,
        `${base}/sent_to_company`,
        `${base}/sent_to_assessor`,
        `${base}/reports`
      ];
    } else if (userType === "internalAssessor") {
      base = `/practices/internalAssessor/assessor_${id}`;
      folders = [`${base}/documents_received`, `${base}/tracking`, `${base}/signed_reports`];
    } else if (userType === "externalAssessor") {
      base = `/practices/externalAssessor/assessor_${id}`;
      folders = [`${base}/delivered_documents`];
    } else if (userType === "company") {
      base = `/practices/company/company_${id}`;
      folders = [`${base}/documents_received`, `${base}/presentation_letters`];
    }

    // Crear carpetas si no existen
    for (const folder of folders) {
      const parts = folder.split("/").filter(Boolean);
      await client.cd("/");
      for (let i = 0; i < parts.length; i++) {
        const path = "/" + parts.slice(0, i + 1).join("/");
        try {
          await client.cd(path);
        } catch {
          await client.send("MKD " + path);
          await client.cd(path);
        }
      }
    }

    console.log(`FTP structure created for ${userType}_${id}`);
  } catch (err) {
    console.error("Error creating FTP structure:", err);
    throw err;
  } finally {
    client.close();
  }
}

module.exports = createFtpStructure;
