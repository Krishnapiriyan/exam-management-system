const { PrismaClient } = require('@prisma/client');
const r2Client = require('../utils/s3');
const multerS3 = require('multer-s3');
const multer = require('multer');

const prisma = new PrismaClient();

// Configure multer with Cloudflare R2 storage
const storage = multerS3({
    s3: r2Client,
    bucket: process.env.R2_BUCKET_NAME,
    key: function (req, file, cb) {
        const fileExtension = file.originalname.split('.').pop();
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, `past-papers/${uniqueSuffix}.${fileExtension}`);
    },
});
const upload = multer({ storage });

// GET /api/exams/:examId/past-papers
const getPastPapersByExam = async (req, res) => {
    try {
        const { examId } = req.params;
        const papers = await prisma.pastPaper.findMany({
            where: { examId: parseInt(examId) },
            include: { exam: { include: { subject: true, batch: true } } },
            orderBy: { createdAt: 'desc' },
        });
        res.json({ success: true, data: papers });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// POST /api/exams/:examId/past-papers  [Protected]
const createPastPaper = async (req, res) => {
    try {
        const { examId } = req.params;
        const { paperType, questionPaperUrl, markingSchemeUrl, description } = req.body;

        const exam = await prisma.exam.findUnique({ where: { id: parseInt(examId) } });
        if (!exam) return res.status(404).json({ success: false, message: 'Exam not found.' });

        // Handle file uploads if files were attached
        let qUrl = questionPaperUrl || null;
        let msUrl = markingSchemeUrl || null;
        let markSheetUrl = req.body.marksSheetUrl || null;
        if (req.files) {
            const publicUrl = process.env.R2_PUBLIC_URL?.replace(/\/$/, '') || '';
            if (req.files.questionPaper) qUrl = `${publicUrl}/${req.files.questionPaper[0].key}`;
            if (req.files.markingScheme) msUrl = `${publicUrl}/${req.files.markingScheme[0].key}`;
            if (req.files.marksSheet) markSheetUrl = `${publicUrl}/${req.files.marksSheet[0].key}`;
        }

        if (!qUrl && !msUrl && !markSheetUrl) {
            return res.status(400).json({ success: false, message: 'At least one file or URL must be provided.' });
        }

        const paper = await prisma.pastPaper.create({
            data: {
                examId: parseInt(examId),
                paperType: paperType || 'both',
                questionPaperUrl: qUrl,
                markingSchemeUrl: msUrl,
                marksSheetUrl: markSheetUrl,
                description,
            },
        });
        res.status(201).json({ success: true, data: paper });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// PUT /api/past-papers/:id  [Protected]
const updatePastPaper = async (req, res) => {
    try {
        const { id } = req.params;
        const { paperType, questionPaperUrl, markingSchemeUrl, description } = req.body;

        let qUrl = questionPaperUrl || undefined;
        let msUrl = markingSchemeUrl || undefined;
        let mSheetUrl = req.body.marksSheetUrl || undefined;
        if (req.files) {
            console.log('--- R2 Upload Debug ---');
            const publicUrl = process.env.R2_PUBLIC_URL?.replace(/\/$/, '') || '';
            console.log('Base Public URL:', publicUrl);
            
            if (req.files.questionPaper) {
                qUrl = `${publicUrl}/${req.files.questionPaper[0].key}`;
            }
            if (req.files.markingScheme) {
                msUrl = `${publicUrl}/${req.files.markingScheme[0].key}`;
            }
            if (req.files.marksSheet) {
                mSheetUrl = `${publicUrl}/${req.files.marksSheet[0].key}`;
            }
            console.log('-----------------------');
        }

        const paper = await prisma.pastPaper.update({
            where: { id: parseInt(id) },
            data: {
                ...(paperType && { paperType }),
                ...(qUrl && { questionPaperUrl: qUrl }),
                ...(msUrl && { markingSchemeUrl: msUrl }),
                ...(mSheetUrl && { marksSheetUrl: mSheetUrl }),
                ...(description !== undefined && { description }),
            },
        });
        res.json({ success: true, data: paper });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// DELETE /api/past-papers/:id  [Protected]
const deletePastPaper = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.pastPaper.delete({ where: { id: parseInt(id) } });
        res.json({ success: true, message: 'Past paper deleted successfully.' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

module.exports = { getPastPapersByExam, createPastPaper, updatePastPaper, deletePastPaper, upload };
