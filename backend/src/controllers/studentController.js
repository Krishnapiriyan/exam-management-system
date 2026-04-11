const { PrismaClient } = require('@prisma/client');
const emailService = require('../services/emailService');

const prisma = new PrismaClient();

// GET /api/batches/:batchId/students
const getStudentsByBatch = async (req, res) => {
    try {
        const { batchId } = req.params;
        const students = await prisma.student.findMany({
            where: { batchId: parseInt(batchId) },
            orderBy: { name: 'asc' },
            include: { subjects: { include: { subject: true } } },
        });
        const result = students.map((s) => ({
            id: s.id,
            name: s.name,
            indexNumber: s.indexNumber,
            email: s.email,
            batchId: s.batchId,
            createdAt: s.createdAt,
            subjects: s.subjects.map((ss) => ss.subject),
        }));
        res.json({ success: true, data: result });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// GET /api/students/:id
const getStudentById = async (req, res) => {
    try {
        const student = await prisma.student.findUnique({
            where: { id: parseInt(req.params.id) },
            include: {
                subjects: { include: { subject: true } },
                batch: true,
            },
        });
        if (!student) return res.status(404).json({ success: false, message: 'Student not found.' });
        res.json({
            success: true,
            data: {
                ...student,
                subjects: student.subjects.map((ss) => ss.subject),
            },
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// POST /api/batches/:batchId/students
const createStudent = async (req, res) => {
    try {
        const { batchId } = req.params;
        const { name, indexNumber, email, subjectIds } = req.body;

        if (!name || !indexNumber || !email) {
            return res.status(400).json({ success: false, message: 'Name, index number, and email are required.' });
        }
        if (!subjectIds || subjectIds.length === 0) {
            return res.status(400).json({ success: false, message: 'At least one subject must be selected.' });
        }

        const existingIndex = await prisma.student.findUnique({ where: { indexNumber } });
        if (existingIndex) return res.status(409).json({ success: false, message: 'Index number already exists.' });

        const batch = await prisma.batch.findUnique({ where: { id: parseInt(batchId) } });
        if (!batch) return res.status(404).json({ success: false, message: 'Batch not found.' });

        const student = await prisma.student.create({
            data: {
                name,
                indexNumber,
                email,
                batchId: parseInt(batchId),
                subjects: {
                    create: subjectIds.map((sid) => ({ subjectId: parseInt(sid) })),
                },
            },
            include: { subjects: { include: { subject: true } }, batch: true },
        });

        // Send registration email (non-blocking)
        const subjects = student.subjects.map((ss) => ss.subject.name);
        emailService.sendRegistrationEmail(student, batch, subjects).catch(console.error);

        res.status(201).json({
            success: true,
            data: { ...student, subjects: student.subjects.map((ss) => ss.subject) },
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// PUT /api/students/:id
const updateStudent = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, indexNumber } = req.body;
        const student = await prisma.student.update({
            where: { id: parseInt(id) },
            data: { name, indexNumber },
            include: { subjects: { include: { subject: true } } },
        });
        res.json({
            success: true,
            data: { ...student, subjects: student.subjects.map((ss) => ss.subject) },
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// DELETE /api/students/:id
const deleteStudent = async (req, res) => {
    try {
        const { id } = req.params;
        const student = await prisma.student.findUnique({
            where: { id: parseInt(id) },
            include: { subjects: { include: { subject: true } } },
        });
        if (!student) return res.status(404).json({ success: false, message: 'Student not found.' });

        await prisma.student.delete({ where: { id: parseInt(id) } });

        // Send removal email (non-blocking)
        emailService.sendRemovalEmail(student).catch(console.error);

        res.json({ success: true, message: 'Student deleted successfully.' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// POST /api/students/verify  (public - index + email check)
const verifyStudent = async (req, res) => {
    try {
        const { indexNumber, email } = req.body;
        if (!indexNumber || !email) {
            return res.status(400).json({ success: false, message: 'Index number and email are required.' });
        }
        const student = await prisma.student.findFirst({
            where: { indexNumber, email },
            include: {
                subjects: { include: { subject: true } },
                batch: true,
            },
        });
        if (!student) {
            return res.status(404).json({ success: false, message: 'Invalid index number or email address.' });
        }
        res.json({
            success: true,
            data: {
                id: student.id,
                name: student.name,
                indexNumber: student.indexNumber,
                batchId: student.batchId,
                batch: student.batch,
                subjects: student.subjects.map((ss) => ss.subject),
            },
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// GET /api/students/:id/results (all results for a student across subjects)
const getStudentResults = async (req, res) => {
    try {
        const { id } = req.params;
        const results = await prisma.result.findMany({
            where: { studentId: parseInt(id) },
            include: {
                exam: { include: { subject: true } },
            },
            orderBy: { exam: { examDate: 'desc' } },
        });

        const now = new Date();
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        const data = results.map((r) => {
            const examStatus = r.exam.examDate < now ? 'Completed' : 'Upcoming';
            let resultStatus = 'Pending';
            if (r.exam.resultReleasedAt) {
                resultStatus = r.exam.resultReleasedAt > oneWeekAgo ? 'New Released' : 'Released';
            }
            return {
                id: r.id,
                examId: r.examId,
                examTitle: r.exam.title,
                examDate: r.exam.examDate,
                durationHours: r.exam.durationHours,
                totalMarks: r.exam.totalMarks,
                subject: r.exam.subject,
                marksObtained: r.marksObtained,
                examStatus,
                resultStatus,
            };
        });

        res.json({ success: true, data });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

module.exports = {
    getStudentsByBatch,
    getStudentById,
    createStudent,
    updateStudent,
    deleteStudent,
    verifyStudent,
    getStudentResults,
};
