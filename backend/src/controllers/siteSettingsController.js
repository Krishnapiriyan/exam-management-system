const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// GET /api/site-settings
const getSiteSettings = async (req, res) => {
    try {
        let settings = await prisma.siteSettings.findFirst({
            include: { contentSections: { orderBy: { sortOrder: 'asc' } } },
        });
        if (!settings) {
            settings = await prisma.siteSettings.create({
                data: { homeTitle: 'Welcome to EMS', homeDescription: 'Exam Management System' },
                include: { contentSections: true },
            });
        }
        res.json({ success: true, data: settings });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// PUT /api/site-settings  [Protected]
const updateSiteSettings = async (req, res) => {
    try {
        const { homeTitle, homeDescription, backgroundVideoUrl } = req.body;
        if (!homeTitle || !homeDescription) {
            return res.status(400).json({ success: false, message: 'Title and description are required.' });
        }

        let settings = await prisma.siteSettings.findFirst();
        if (!settings) {
            settings = await prisma.siteSettings.create({ data: { homeTitle, homeDescription, backgroundVideoUrl } });
        } else {
            settings = await prisma.siteSettings.update({
                where: { id: settings.id },
                data: { homeTitle, homeDescription, backgroundVideoUrl },
            });
        }
        res.json({ success: true, data: settings });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// POST /api/site-settings/sections  [Protected]
const createSection = async (req, res) => {
    try {
        const { heading, description, mediaUrl, sortOrder } = req.body;
        if (!heading) return res.status(400).json({ success: false, message: 'Section heading is required.' });
        let settings = await prisma.siteSettings.findFirst();
        if (!settings) settings = await prisma.siteSettings.create({ data: {} });
        const section = await prisma.contentSection.create({
            data: { heading, description, mediaUrl, sortOrder: parseInt(sortOrder) || 0, siteSettingsId: settings.id },
        });
        res.status(201).json({ success: true, data: section });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// PUT /api/site-settings/sections/:id  [Protected]
const updateSection = async (req, res) => {
    try {
        const { id } = req.params;
        const { heading, description, mediaUrl, sortOrder } = req.body;
        const section = await prisma.contentSection.update({
            where: { id: parseInt(id) },
            data: { heading, description, mediaUrl, sortOrder: parseInt(sortOrder) || 0 },
        });
        res.json({ success: true, data: section });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// DELETE /api/site-settings/sections/:id  [Protected]
const deleteSection = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.contentSection.delete({ where: { id: parseInt(id) } });
        res.json({ success: true, message: 'Section deleted.' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// POST /api/site-settings/upload-media  [Protected]
const uploadSiteMedia = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file uploaded.' });
        }
        // Construct public URL using configuration
        const publicUrl = process.env.R2_PUBLIC_URL?.replace(/\/$/, '') || '';
        const url = `${publicUrl}/${req.file.key}`;
        res.json({ success: true, url });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

module.exports = { getSiteSettings, updateSiteSettings, createSection, updateSection, deleteSection, uploadSiteMedia };
