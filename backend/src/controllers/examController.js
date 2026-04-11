const { PrismaClient } = require('@prisma/client');
const emailService = require('../services/emailService');

const prisma = new PrismaClient();

const computeExamStatus = (examDate) => (new Date(examDate) < new Date() ? 'Completed' : 'Upcoming');
const computeResultStatus = (releasedAt) => {
    if (!releasedAt) return 'Pending';
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    return new Date(releasedAt) > oneWeekAgo ? 'New Released' : 'Released';
};

// GET /api/batches/:batchId/subjects/:subjectId/exams
const getExamsByBatchAndSubject = async (req, res) => {
    try {
        const { batchId, subjectId } = req.params;
        const exams = await prisma.exam.findMany({
            where: { batchId: parseInt(batchId), subjectId: parseInt(subjectId) },
            include: { subject: true, batch: true },
            orderBy: { examDate: 'desc' },
        });
        const data = exams.map((e) => ({
            ...e,
            examStatus: computeExamStatus(e.examDate),
            resultStatus: computeResultStatus(e.resultReleasedAt),
        }));
        res.json({ success: true, data });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// GET /api/exams (all exams — for timetable calendar)
const getAllExams = async (req, res) => {
    try {
        const exams = await prisma.exam.findMany({
            include: { subject: true, batch: true },
            orderBy: { examDate: 'asc' },
        });
        const data = exams.map((e) => ({
            ...e,
            examStatus: computeExamStatus(e.examDate),
            resultStatus: computeResultStatus(e.resultReleasedAt),
        }));
        res.json({ success: true, data });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// GET /api/exams/:id
const getExamById = async (req, res) => {
    try {
        const exam = await prisma.exam.findUnique({
            where: { id: parseInt(req.params.id) },
            include: { subject: true, batch: true },
        });
        if (!exam) return res.status(404).json({ success: false, message: 'Exam not found.' });
        res.json({
            success: true,
            data: {
                ...exam,
                examStatus: computeExamStatus(exam.examDate),
                resultStatus: computeResultStatus(exam.resultReleasedAt),
            },
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// POST /api/batches/:batchId/subjects/:subjectId/exams
const createExam = async (req, res) => {
    try {
        const { batchId, subjectId } = req.params;
        const { title, description, examDate, durationHours, totalMarks } = req.body;

        if (!title || !examDate || !durationHours) {
            return res.status(400).json({ success: false, message: 'Title, exam date, and duration are required.' });
        }
        if (totalMarks !== undefined && (isNaN(totalMarks) || totalMarks <= 0)) {
            return res.status(400).json({ success: false, message: 'Total marks must be a positive number.' });
        }

        const exam = await prisma.exam.create({
            data: {
                title,
                description,
                examDate: new Date(examDate),
                durationHours: parseFloat(durationHours),
                totalMarks: totalMarks ? parseInt(totalMarks) : 100,
                batchId: parseInt(batchId),
                subjectId: parseInt(subjectId),
            },
            include: { subject: true, batch: true },
        });

        // Notify eligible students (same batch + same subject) — non-blocking
        const eligibleStudents = await prisma.student.findMany({
            where: {
                batchId: parseInt(batchId),
                subjects: { some: { subjectId: parseInt(subjectId) } },
            },
        });
        emailService.sendExamCreatedEmail(exam, eligibleStudents).catch(console.error);

        res.status(201).json({
            success: true,
            data: { ...exam, examStatus: computeExamStatus(exam.examDate), resultStatus: 'Pending' },
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// PUT /api/exams/:id
const updateExam = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, examDate, durationHours, totalMarks } = req.body;
        const exam = await prisma.exam.update({
            where: { id: parseInt(id) },
            data: {
                ...(title && { title }),
                ...(description !== undefined && { description }),
                ...(examDate && { examDate: new Date(examDate) }),
                ...(durationHours && { durationHours: parseFloat(durationHours) }),
                ...(totalMarks && { totalMarks: parseInt(totalMarks) }),
            },
            include: { subject: true, batch: true },
        });

        // Notify eligible students about the update — non-blocking
        const eligibleStudents = await prisma.student.findMany({
            where: {
                batchId: exam.batchId,
                subjects: { some: { subjectId: exam.subjectId } },
            },
        });
        emailService.sendExamUpdatedEmail(exam, eligibleStudents).catch(console.error);

        res.json({
            success: true,
            data: { ...exam, examStatus: computeExamStatus(exam.examDate), resultStatus: computeResultStatus(exam.resultReleasedAt) },
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// DELETE /api/exams/:id
const deleteExam = async (req, res) => {
    try {
        const { id } = req.params;
        const exam = await prisma.exam.findUnique({
            where: { id: parseInt(id) },
            include: { subject: true, batch: true },
        });
        if (!exam) return res.status(404).json({ success: false, message: 'Exam not found.' });

        // Find eligible students before deletion for email notification
        const eligibleStudents = await prisma.student.findMany({
            where: {
                batchId: exam.batchId,
                subjects: { some: { subjectId: exam.subjectId } },
            },
        });

        await prisma.exam.delete({ where: { id: parseInt(id) } });

        // Notify about cancellation — non-blocking
        emailService.sendExamCancelledEmail(exam, eligibleStudents).catch(console.error);

        res.json({ success: true, message: 'Exam deleted successfully.' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

module.exports = { getExamsByBatchAndSubject, getAllExams, getExamById, createExam, updateExam, deleteExam };
