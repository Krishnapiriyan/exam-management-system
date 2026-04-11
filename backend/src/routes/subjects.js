const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// GET /api/subjects
router.get('/', async (req, res) => {
    try {
        const subjects = await prisma.subject.findMany({ orderBy: { id: 'asc' } });
        res.json({ success: true, data: subjects });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;
