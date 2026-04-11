const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

// GET /api/admins
const getAllAdmins = async (req, res) => {
    try {
        const admins = await prisma.admin.findMany({
            select: { id: true, name: true, email: true, createdAt: true },
            orderBy: { createdAt: 'asc' },
        });
        res.json({ success: true, data: admins });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// POST /api/admins
const createAdmin = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        if (!name || !email || !password) {
            return res.status(400).json({ success: false, message: 'Name, email, and password are required.' });
        }
        if (password.length < 8) {
            return res.status(400).json({ success: false, message: 'Password must be at least 8 characters.' });
        }
        const existing = await prisma.admin.findUnique({ where: { email } });
        if (existing) {
            return res.status(409).json({ success: false, message: 'Email already registered.' });
        }
        const hashed = await bcrypt.hash(password, 10);
        const admin = await prisma.admin.create({
            data: { name, email, password: hashed },
            select: { id: true, name: true, email: true, createdAt: true },
        });
        res.status(201).json({ success: true, data: admin });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// PUT /api/admins/:id
const updateAdmin = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, email } = req.body;
        const admin = await prisma.admin.update({
            where: { id: parseInt(id) },
            data: { name, email },
            select: { id: true, name: true, email: true, createdAt: true },
        });
        res.json({ success: true, data: admin });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// DELETE /api/admins/:id
const deleteAdmin = async (req, res) => {
    try {
        const { id } = req.params;
        // Prevent deleting the last admin
        const count = await prisma.admin.count();
        if (count <= 1) {
            return res.status(400).json({ success: false, message: 'Cannot delete the only remaining administrator.' });
        }
        await prisma.admin.delete({ where: { id: parseInt(id) } });
        res.json({ success: true, message: 'Administrator deleted successfully.' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// PUT /api/admins/:id/change-password
const changePassword = async (req, res) => {
    try {
        const { id } = req.params;
        const { currentPassword, newPassword, confirmPassword } = req.body;

        if (!currentPassword || !newPassword || !confirmPassword) {
            return res.status(400).json({ success: false, message: 'All password fields are required.' });
        }
        if (newPassword !== confirmPassword) {
            return res.status(400).json({ success: false, message: 'New password and confirm password do not match.' });
        }
        if (newPassword.length < 8) {
            return res.status(400).json({ success: false, message: 'New password must be at least 8 characters.' });
        }

        const admin = await prisma.admin.findUnique({ where: { id: parseInt(id) } });
        if (!admin) return res.status(404).json({ success: false, message: 'Admin not found.' });

        const isMatch = await bcrypt.compare(currentPassword, admin.password);
        if (!isMatch) return res.status(401).json({ success: false, message: 'Current password is incorrect.' });

        const hashed = await bcrypt.hash(newPassword, 10);
        await prisma.admin.update({ where: { id: parseInt(id) }, data: { password: hashed } });
        res.json({ success: true, message: 'Password changed successfully.' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

module.exports = { getAllAdmins, createAdmin, updateAdmin, deleteAdmin, changePassword };
