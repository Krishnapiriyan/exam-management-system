const { PrismaClient } = require('@prisma/client');
const emailService = require('../services/emailService');

const prisma = new PrismaClient();

const computeResultStatus = (releasedAt) => {
    if (!releasedAt) return 'Pending';
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    return new Date(releasedAt) > oneWeekAgo ? 'New Released' : 'Released';
};

// GET /api/exams/:examId/results  [Protected]
const getResultsByExam = async (req, res) => {
    try {
        const { examId } = req.params;
        const exam = await prisma.exam.findUnique({
            where: { id: parseInt(examId) },
            include: { subject: true },
        });
        if (!exam) return res.status(404).json({ success: false, message: 'Exam not found.' });

        // Get all students enrolled in this subject+batch
        const students = await prisma.student.findMany({
            where: {
                batchId: exam.batchId,
                subjects: { some: { subjectId: exam.subjectId } },
            },
            orderBy: { name: 'asc' },
        });

        // Get existing results
        const results = await prisma.result.findMany({ where: { examId: parseInt(examId) } });
        const resultMap = {};
        results.forEach((r) => { resultMap[r.studentId] = r; });

        const data = students.map((s) => ({
            studentId: s.id,
            studentName: s.name,
            indexNumber: s.indexNumber,
            resultId: resultMap[s.id]?.id || null,
            marksObtained: resultMap[s.id]?.marksObtained ?? null,
        }));

        res.json({
            success: true,
            data,
            exam: { ...exam, resultStatus: computeResultStatus(exam.resultReleasedAt) },
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// POST /api/exams/:examId/results  [Protected] — bulk upsert marks
const saveResults = async (req, res) => {
    try {
        const { examId } = req.params;
        const { results } = req.body; // [{ studentId, marksObtained }]
        const exam = await prisma.exam.findUnique({ where: { id: parseInt(examId) } });
        if (!exam) return res.status(404).json({ success: false, message: 'Exam not found.' });

        for (const r of results) {
            if (r.marksObtained !== null && r.marksObtained !== undefined) {
                if (isNaN(r.marksObtained) || r.marksObtained < 0 || r.marksObtained > exam.totalMarks) {
                    return res.status(400).json({
                        success: false,
                        message: `Marks for student ${r.studentId} must be between 0 and ${exam.totalMarks}.`,
                    });
                }
            }
            await prisma.result.upsert({
                where: { examId_studentId: { examId: parseInt(examId), studentId: parseInt(r.studentId) } },
                update: { marksObtained: r.marksObtained !== null ? parseFloat(r.marksObtained) : null },
                create: {
                    examId: parseInt(examId),
                    studentId: parseInt(r.studentId),
                    marksObtained: r.marksObtained !== null ? parseFloat(r.marksObtained) : null,
                },
            });
        }
        res.json({ success: true, message: 'Results saved successfully.' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// POST /api/exams/:examId/release  [Protected]
const releaseResults = async (req, res) => {
    try {
        const { examId } = req.params;
        const exam = await prisma.exam.findUnique({
            where: { id: parseInt(examId) },
            include: { subject: true, batch: true },
        });
        if (!exam) return res.status(404).json({ success: false, message: 'Exam not found.' });

        // Check at least one mark entered
        const marksCount = await prisma.result.count({
            where: { examId: parseInt(examId), marksObtained: { not: null } },
        });
        if (marksCount === 0) {
            return res.status(400).json({ success: false, message: 'Cannot release results. No marks have been entered yet.' });
        }

        // Check if exam is actually finished (Current Time > Start Time + Duration)
        const endTime = new Date(new Date(exam.examDate).getTime() + exam.durationHours * 60 * 60 * 1000);
        if (new Date() < endTime) {
            return res.status(400).json({ 
                success: false, 
                message: `Cannot release results yet. The exam is scheduled to finish at ${endTime.toLocaleTimeString()}.` 
            });
        }

        const updated = await prisma.exam.update({
            where: { id: parseInt(examId) },
            data: { resultReleasedAt: new Date() },
        });

        // Get students with results for email notification
        const studentsWithResults = await prisma.result.findMany({
            where: { examId: parseInt(examId), marksObtained: { not: null } },
            include: { student: true },
        });
        const students = studentsWithResults.map((r) => r.student);
        emailService.sendResultsReleasedEmail(exam, students).catch(console.error);

        res.json({
            success: true,
            message: 'Results released successfully.',
            data: { resultReleasedAt: updated.resultReleasedAt },
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// GET /api/exams/:examId/results/summary  [Protected]
const getResultSummary = async (req, res) => {
    try {
        const { examId } = req.params;
        const exam = await prisma.exam.findUnique({ where: { id: parseInt(examId) } });
        if (!exam) return res.status(404).json({ success: false, message: 'Exam not found.' });

        const totalStudents = await prisma.student.count({
            where: {
                batchId: exam.batchId,
                subjects: { some: { subjectId: exam.subjectId } },
            },
        });

        const withMarks = await prisma.result.findMany({
            where: { examId: parseInt(examId), marksObtained: { not: null } },
            select: { marksObtained: true },
        });

        const marks = withMarks.map((r) => r.marksObtained);
        const avg = marks.length ? marks.reduce((a, b) => a + b, 0) / marks.length : null;
        const highest = marks.length ? Math.max(...marks) : null;
        const lowest = marks.length ? Math.min(...marks) : null;

        res.json({
            success: true,
            data: {
                totalStudents,
                withMarks: marks.length,
                withoutMarks: totalStudents - marks.length,
                average: avg ? parseFloat(avg.toFixed(2)) : null,
                highest,
                lowest,
            },
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// GET /api/exams/:examId/results/distribution
const getResultDistribution = async (req, res) => {
    try {
        const { examId } = req.params;
        const results = await prisma.result.findMany({
            where: { examId: parseInt(examId), marksObtained: { not: null } },
            select: { marksObtained: true },
            include: undefined,
        });

        const exam = await prisma.exam.findUnique({ where: { id: parseInt(examId) } });
        const total = exam?.totalMarks || 100;

        const ranges = [
            { label: `0-${Math.floor(total * 0.4)}`, min: 0, max: total * 0.4 },
            { label: `${Math.floor(total * 0.4) + 1}-${Math.floor(total * 0.6)}`, min: total * 0.4 + 1, max: total * 0.6 },
            { label: `${Math.floor(total * 0.6) + 1}-${Math.floor(total * 0.8)}`, min: total * 0.6 + 1, max: total * 0.8 },
            { label: `${Math.floor(total * 0.8) + 1}-${total}`, min: total * 0.8 + 1, max: total },
        ];

        const distribution = ranges.map((range) => ({
            range: range.label,
            count: results.filter((r) => r.marksObtained >= range.min && r.marksObtained <= range.max).length,
        }));

        res.json({ success: true, data: distribution });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

module.exports = { getResultsByExam, saveResults, releaseResults, getResultSummary, getResultDistribution };
