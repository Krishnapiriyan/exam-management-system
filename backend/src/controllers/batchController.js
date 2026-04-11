const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// GET /api/batches
const getAllBatches = async (req, res) => {
    try {
        const batches = await prisma.batch.findMany({
            orderBy: { year: 'asc' },
            include: {
                _count: { select: { students: true } },
                students: {
                    include: { subjects: { include: { subject: true } } },
                },
            },
        });

        // Build subject-wise counts for each batch
        const result = batches.map((batch) => {
            const subjectCounts = {};
            batch.students.forEach((student) => {
                student.subjects.forEach((ss) => {
                    const name = ss.subject.name;
                    subjectCounts[name] = (subjectCounts[name] || 0) + 1;
                });
            });
            return {
                id: batch.id,
                year: batch.year,
                description: batch.description,
                coverPhotoUrl: batch.coverPhotoUrl,
                createdAt: batch.createdAt,
                totalStudents: batch._count.students,
                subjectCounts,
            };
        });

        res.json({ success: true, data: result });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// POST /api/batches
const createBatch = async (req, res) => {
    try {
        const { year, description, coverPhotoUrl } = req.body;
        if (!year) return res.status(400).json({ success: false, message: 'Batch year is required.' });

        const existing = await prisma.batch.findUnique({ where: { year: parseInt(year) } });
        if (existing) return res.status(409).json({ success: false, message: 'A batch with this year already exists.' });

        const batch = await prisma.batch.create({
            data: { year: parseInt(year), description, coverPhotoUrl },
        });
        res.status(201).json({ success: true, data: batch });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// PUT /api/batches/:id
const updateBatch = async (req, res) => {
    try {
        const { id } = req.params;
        const { description, coverPhotoUrl } = req.body;
        const batch = await prisma.batch.update({
            where: { id: parseInt(id) },
            data: { description, coverPhotoUrl },
        });
        res.json({ success: true, data: batch });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// DELETE /api/batches/:id  (cascade handled by Prisma schema)
const deleteBatch = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.batch.delete({ where: { id: parseInt(id) } });
        res.json({ success: true, message: 'Batch and all related data deleted successfully.' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

module.exports = { getAllBatches, createBatch, updateBatch, deleteBatch };
