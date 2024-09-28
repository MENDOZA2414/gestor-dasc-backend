const pool = require('../config/db');

const getApplicationsByPositionID = async (positionID) => {
    const query = `
        SELECT A.*, P.title AS positionTitle
        FROM StudentApplication A
        INNER JOIN PracticePosition P ON A.practicePositionID = P.practicePositionID
        WHERE A.practicePositionID = ?
    `;
    const [results] = await pool.query(query, [positionID]);
    return results.map(application => ({
        ...application,
        coverLetter: application.coverLetter ? Buffer.from(application.coverLetter).toString('base64') : null
    }));
};

const getCoverLetterByID = async (applicationID) => {
    const query = 'SELECT coverLetter FROM StudentApplication WHERE applicationID = ?';
    const [results] = await pool.query(query, [applicationID]);
    return results.length > 0 ? results[0].coverLetter : null;
};

const verifyStudentApplication = async (studentID, positionID) => {
    const query = 'SELECT COUNT(*) as count FROM StudentApplication WHERE studentID = ? AND practicePositionID = ?';
    const [results] = await pool.query(query, [studentID, positionID]);
    return results[0].count > 0;
};

const getApplicationsByStudentID = async (studentID) => {
    const query = 'SELECT practicePositionID FROM StudentApplication WHERE studentID = ?';
    const [results] = await pool.query(query, [studentID]);
    return results;
};

const rejectApplication = async (applicationID) => {
    const query = 'DELETE FROM StudentApplication WHERE applicationID = ?';
    const [result] = await pool.query(query, [applicationID]);
    return result.affectedRows > 0;
};

const acceptApplication = async (applicationID) => {
    const queryApplication = `
        SELECT 
            A.studentID, A.practicePositionID, A.studentName, A.studentEmail,
            P.companyID, P.externalAssessorID, P.title AS positionTitle,
            P.startDate, P.endDate
        FROM 
            StudentApplication A
        JOIN 
            PracticePosition P ON A.practicePositionID = P.practicePositionID
        WHERE 
            A.applicationID = ?
    `;

    const queryCheckPractice = `SELECT * FROM ProfessionalPractices WHERE studentID = ?`;
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();
        const [resultApplication] = await connection.query(queryApplication, [applicationID]);

        if (resultApplication.length === 0) throw new Error('No application found');

        const application = resultApplication[0];
        const [resultPractice] = await connection.query(queryCheckPractice, [application.studentID]);

        if (resultPractice.length > 0) {
            const queryDeleteApplications = `DELETE FROM StudentApplication WHERE studentID = ?`;
            await connection.query(queryDeleteApplications, [application.studentID]);
            await connection.commit();
            throw new Error('The student already has a registered professional practice. All their applications have been deleted.');
        }

        const startDate = application.startDate instanceof Date ? application.startDate.toISOString().split('T')[0] : application.startDate;
        const endDate = application.endDate instanceof Date ? application.endDate.toISOString().split('T')[0] : application.endDate;

        const queryInsertPractice = `
            INSERT INTO ProfessionalPractices 
            (studentID, companyID, externalAssessorID, startDate, endDate, status, positionTitle, creationDate)
            VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
        `;
        const values = [
            application.studentID, 
            application.companyID, 
            application.externalAssessorID, 
            startDate, 
            endDate, 
            'Started',
            application.positionTitle
        ];

        await connection.query(queryInsertPractice, values);

        const queryDeleteApplications = `DELETE FROM StudentApplication WHERE studentID = ?`;
        await connection.query(queryDeleteApplications, [application.studentID]);

        const queryDeletePosition = `DELETE FROM PracticePosition WHERE practicePositionID = ?`;
        await connection.query(queryDeletePosition, [application.practicePositionID]);

        await connection.commit();
        return { message: 'Professional practice registered, applications deleted, and position removed successfully' };
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

module.exports = {
    getApplicationsByPositionID,
    getCoverLetterByID,
    verifyStudentApplication,
    getApplicationsByStudentID,
    rejectApplication,
    acceptApplication
};
