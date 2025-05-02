const ftp = require("basic-ftp");

async function createFtpStructure(client, studentID) {
  const base = `/practices/students/student_${studentID}`;

  const studentFolders = [
    `${base}/profile`,                     // perfil del alumno
    `${base}/curriculums`,                // CVs
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

  const sharedFolders = [
    `/practices/internalAssessor/assessor_{id}/documents_received`,
    `/practices/internalAssessor/assessor_{id}/tracking`,
    `/practices/internalAssessor/assessor_{id}/signed_reports`,
    `/practices/externalAssessor/assessor_{id}/delivered_documents`,
    `/practices/company/company_{id}/documents_received`,
    `/practices/company/company_{id}/presentation_letters`,
    `/practices/formats/templates`,
    `/practices/formats/guides`,
    `/practices/formats/general`
  ];

  try {
    await client.cd("/");

    for (const folder of [...studentFolders, ...sharedFolders]) {
      const parts = folder.split("/").filter(Boolean);
      for (let i = 0; i < parts.length; i++) {
        const path = "/" + parts.slice(0, i + 1).join("/");
        try {
          await client.cd(path);
        } catch {
          await client.send("MKD " + path);
        }
      }
    }

    console.log(`FTP structure created for student_${studentID}`);
  } catch (err) {
    console.error("Error creating FTP structure:", err);
    throw err;
  }
}

module.exports = createFtpStructure;
