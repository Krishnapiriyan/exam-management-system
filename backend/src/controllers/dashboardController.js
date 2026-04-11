const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// GET /api/dashboard/stats  [Protected]
const getGlobalStats = async (req, res) => {
    try {
        const totalStudents = await prisma.student.count();
        const totalAdmins = await prisma.admin.count();

        const mathSubject = await prisma.subject.findFirst({ where: { name: 'Mathematics' } });
        const bioSubject = await prisma.subject.findFirst({ where: { name: 'Biology' } });

        const mathStudents = mathSubject
            ? await prisma.studentSubject.count({ where: { subjectId: mathSubject.id } })
            : 0;
        const bioStudents = bioSubject
            ? await prisma.studentSubject.count({ where: { subjectId: bioSubject.id } })
            : 0;

        res.json({
            success: true,
            data: { totalStudents, totalAdmins, mathStudents, bioStudents },
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// GET /api/dashboard/batch/:batchId/stats  [Protected]
const getBatchStats = async (req, res) => {
    try {
        const { batchId } = req.params;
        const bid = parseInt(batchId);

        const subjects = await prisma.subject.findMany();
        const totalStudents = await prisma.student.count({ where: { batchId: bid } });

        const subjectStats = await Promise.all(
            subjects.map(async (subject) => {
                const studentCount = await prisma.studentSubject.count({
                    where: { subjectId: subject.id, student: { batchId: bid } },
                });
                const examCount = await prisma.exam.count({ where: { batchId: bid, subjectId: subject.id } });
                const releasedCount = await prisma.exam.count({
                    where: { batchId: bid, subjectId: subject.id, resultReleasedAt: { not: null } },
                });
                return { subject: subject.name, studentCount, examCount, releasedCount };
            })
        );

        const totalExams = await prisma.exam.count({ where: { batchId: bid } });
        const releasedExams = await prisma.exam.count({ where: { batchId: bid, resultReleasedAt: { not: null } } });

        res.json({
            success: true,
            data: {
                totalStudents,
                subjectStats,
                totalExams,
                releasedExams,
                pendingExams: totalExams - releasedExams,
            },
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

module.exports = { getGlobalStats, getBatchStats };
