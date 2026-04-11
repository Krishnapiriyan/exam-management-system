const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

const sendMail = async ({ to, subject, html }) => {
    if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY.includes('PLACEHOLDER')) {
        console.log(`[Email skipped - no Resend API key] To: ${to} | Subject: ${subject}`);
        return;
    }

    try {
        // Resend handles singular strings or arrays for 'to'. 
        // We split by comma to handle multiple recipients if passed as a string.
        const recipients = typeof to === 'string' && to.includes(',') ? to.split(',').map(e => e.trim()) : to;
        
        const { data, error } = await resend.emails.send({
            from: process.env.EMAIL_FROM || 'onboarding@resend.dev',
            to: recipients,
            subject: subject,
            html: html,
        });

        if (error) {
            console.error('Resend Email Error:', error);
            return { success: false, error };
        }

        return { success: true, data };
    } catch (error) {
        console.error('Resend Exception:', error);
        return { success: false, error: error.message };
    }
};

// ── 1. Student Registration ────────────────────────────────────────────────────
const sendRegistrationEmail = async (student, batch, subjects) => {
    const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;border:1px solid #e0e0e0;border-radius:8px;overflow:hidden">
      <div style="background:#1e40af;padding:24px;text-align:center">
        <h1 style="color:white;margin:0">Exam Management System</h1>
      </div>
      <div style="padding:32px">
        <h2 style="color:#1e40af">Welcome, ${student.name}! 🎉</h2>
        <p>You have been successfully registered in the Exam Management System.</p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0">
          <tr><td style="padding:8px;border:1px solid #e0e0e0;background:#f9fafb;font-weight:bold">Student Name</td><td style="padding:8px;border:1px solid #e0e0e0">${student.name}</td></tr>
          <tr><td style="padding:8px;border:1px solid #e0e0e0;background:#f9fafb;font-weight:bold">Index Number</td><td style="padding:8px;border:1px solid #e0e0e0">${student.indexNumber}</td></tr>
          <tr><td style="padding:8px;border:1px solid #e0e0e0;background:#f9fafb;font-weight:bold">Batch Year</td><td style="padding:8px;border:1px solid #e0e0e0">${batch.year}</td></tr>
          <tr><td style="padding:8px;border:1px solid #e0e0e0;background:#f9fafb;font-weight:bold">Enrolled Subjects</td><td style="padding:8px;border:1px solid #e0e0e0">${subjects.join(', ')}</td></tr>
        </table>
        <p style="color:#6b7280;font-size:0.9em">Keep your index number and email address safe — you'll need them to access your exam results.</p>
      </div>
      <div style="background:#f3f4f6;padding:16px;text-align:center;color:#6b7280;font-size:0.85em">Exam Management System — Automated Notification</div>
    </div>`;
    return sendMail({ to: student.email, subject: `[EMS] Registration Confirmed — Welcome ${student.name}!`, html });
};

// ── 2. Student Removal ────────────────────────────────────────────────────────
const sendRemovalEmail = async (student) => {
    const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;border:1px solid #e0e0e0;border-radius:8px;overflow:hidden">
      <div style="background:#dc2626;padding:24px;text-align:center">
        <h1 style="color:white;margin:0">Exam Management System</h1>
      </div>
      <div style="padding:32px">
        <h2 style="color:#dc2626">Account Removal Notice</h2>
        <p>Dear <strong>${student.name}</strong>,</p>
        <p>Your registration in the Exam Management System has been removed by an administrator.</p>
        <p><strong>Effective Date:</strong> ${new Date().toLocaleDateString()}</p>
        <p>If you believe this is an error, please contact your school administrator.</p>
      </div>
      <div style="background:#f3f4f6;padding:16px;text-align:center;color:#6b7280;font-size:0.85em">Exam Management System — Automated Notification</div>
    </div>`;
    return sendMail({ to: student.email, subject: '[EMS] Your Registration Has Been Removed', html });
};

// ── 3. Exam Created ───────────────────────────────────────────────────────────
const sendExamCreatedEmail = async (exam, students) => {
    if (!students || students.length === 0) return;
    const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;border:1px solid #e0e0e0;border-radius:8px;overflow:hidden">
      <div style="background:#1e40af;padding:24px;text-align:center">
        <h1 style="color:white;margin:0">Exam Management System</h1>
      </div>
      <div style="padding:32px">
        <h2 style="color:#1e40af">📅 New Exam Scheduled</h2>
        <p>A new examination has been scheduled for your batch.</p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0">
          <tr><td style="padding:8px;border:1px solid #e0e0e0;background:#f9fafb;font-weight:bold">Subject</td><td style="padding:8px;border:1px solid #e0e0e0">${exam.subject?.name || ''}</td></tr>
          <tr><td style="padding:8px;border:1px solid #e0e0e0;background:#f9fafb;font-weight:bold">Exam Title</td><td style="padding:8px;border:1px solid #e0e0e0">${exam.title}</td></tr>
          <tr><td style="padding:8px;border:1px solid #e0e0e0;background:#f9fafb;font-weight:bold">Date</td><td style="padding:8px;border:1px solid #e0e0e0">${new Date(exam.examDate).toLocaleDateString()}</td></tr>
          <tr><td style="padding:8px;border:1px solid #e0e0e0;background:#f9fafb;font-weight:bold">Duration</td><td style="padding:8px;border:1px solid #e0e0e0">${exam.durationHours} hour(s)</td></tr>
          <tr><td style="padding:8px;border:1px solid #e0e0e0;background:#f9fafb;font-weight:bold">Batch Year</td><td style="padding:8px;border:1px solid #e0e0e0">${exam.batch?.year || ''}</td></tr>
        </table>
        <p>Please check the Timetables page for more details.</p>
      </div>
      <div style="background:#f3f4f6;padding:16px;text-align:center;color:#6b7280;font-size:0.85em">Exam Management System — Automated Notification</div>
    </div>`;
    const emails = students.map((s) => s.email).filter(Boolean);
    if (emails.length === 0) return;
    return sendMail({ to: emails.join(','), subject: `[EMS] New Exam Scheduled — ${exam.title}`, html });
};

// ── 4. Exam Cancelled ─────────────────────────────────────────────────────────
const sendExamCancelledEmail = async (exam, students) => {
    if (!students || students.length === 0) return;
    const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;border:1px solid #e0e0e0;border-radius:8px;overflow:hidden">
      <div style="background:#f59e0b;padding:24px;text-align:center">
        <h1 style="color:white;margin:0">Exam Management System</h1>
      </div>
      <div style="padding:32px">
        <h2 style="color:#f59e0b">⚠️ Exam Cancelled</h2>
        <p>The following exam has been <strong>cancelled</strong>:</p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0">
          <tr><td style="padding:8px;border:1px solid #e0e0e0;background:#f9fafb;font-weight:bold">Subject</td><td style="padding:8px;border:1px solid #e0e0e0">${exam.subject?.name || ''}</td></tr>
          <tr><td style="padding:8px;border:1px solid #e0e0e0;background:#f9fafb;font-weight:bold">Exam Title</td><td style="padding:8px;border:1px solid #e0e0e0">${exam.title}</td></tr>
          <tr><td style="padding:8px;border:1px solid #e0e0e0;background:#f9fafb;font-weight:bold">Original Date</td><td style="padding:8px;border:1px solid #e0e0e0">${new Date(exam.examDate).toLocaleDateString()}</td></tr>
        </table>
        <p>Please contact your administrator if you have questions.</p>
      </div>
      <div style="background:#f3f4f6;padding:16px;text-align:center;color:#6b7280;font-size:0.85em">Exam Management System — Automated Notification</div>
    </div>`;
    const emails = students.map((s) => s.email).filter(Boolean);
    if (emails.length === 0) return;
    return sendMail({ to: emails.join(','), subject: `[EMS] Exam Cancelled — ${exam.title}`, html });
};

// ── 5. Results Released ───────────────────────────────────────────────────────
const sendResultsReleasedEmail = async (exam, students) => {
    if (!students || students.length === 0) return;
    const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;border:1px solid #e0e0e0;border-radius:8px;overflow:hidden">
      <div style="background:#16a34a;padding:24px;text-align:center">
        <h1 style="color:white;margin:0">Exam Management System</h1>
      </div>
      <div style="padding:32px">
        <h2 style="color:#16a34a">🎓 Exam Results Available</h2>
        <p>Results have been released for the following exam:</p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0">
          <tr><td style="padding:8px;border:1px solid #e0e0e0;background:#f9fafb;font-weight:bold">Subject</td><td style="padding:8px;border:1px solid #e0e0e0">${exam.subject?.name || ''}</td></tr>
          <tr><td style="padding:8px;border:1px solid #e0e0e0;background:#f9fafb;font-weight:bold">Exam Title</td><td style="padding:8px;border:1px solid #e0e0e0">${exam.title}</td></tr>
        </table>
        <p>To view your results, visit the <strong>Results</strong> page and enter your <strong>index number</strong> and <strong>email address</strong>.</p>
        <p style="color:#6b7280;font-size:0.85em">⚠️ Actual marks are not included in this email for privacy reasons.</p>
      </div>
      <div style="background:#f3f4f6;padding:16px;text-align:center;color:#6b7280;font-size:0.85em">Exam Management System — Automated Notification</div>
    </div>`;
    const emails = students.map((s) => s.email).filter(Boolean);
    if (emails.length === 0) return;
    return sendMail({ to: emails.join(','), subject: `[EMS] Results Released — ${exam.title}`, html });
};

// ── 6. Exam Updated ──────────────────────────────────────────────────────────
const sendExamUpdatedEmail = async (exam, students) => {
    if (!students || students.length === 0) return;
    const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;border:1px solid #e0e0e0;border-radius:8px;overflow:hidden">
      <div style="background:#1e40af;padding:24px;text-align:center">
        <h1 style="color:white;margin:0">Exam Management System</h1>
      </div>
      <div style="padding:32px">
        <h2 style="color:#1e40af">📝 Exam Details Updated</h2>
        <p>The details for your upcoming exam have been updated.</p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0">
          <tr><td style="padding:8px;border:1px solid #e0e0e0;background:#f9fafb;font-weight:bold">Subject</td><td style="padding:8px;border:1px solid #e0e0e0">${exam.subject?.name || ''}</td></tr>
          <tr><td style="padding:8px;border:1px solid #e0e0e0;background:#f9fafb;font-weight:bold">Exam Title</td><td style="padding:8px;border:1px solid #e0e0e0">${exam.title}</td></tr>
          <tr><td style="padding:8px;border:1px solid #e0e0e0;background:#f9fafb;font-weight:bold">New Date</td><td style="padding:8px;border:1px solid #e0e0e0">${new Date(exam.examDate).toLocaleDateString()}</td></tr>
          <tr><td style="padding:8px;border:1px solid #e0e0e0;background:#f9fafb;font-weight:bold">Duration</td><td style="padding:8px;border:1px solid #e0e0e0">${exam.durationHours} hour(s)</td></tr>
        </table>
        <p>Please check the Student Portal for any further instructions.</p>
      </div>
      <div style="background:#f3f4f6;padding:16px;text-align:center;color:#6b7280;font-size:0.85em">Exam Management System — Automated Notification</div>
    </div>`;
    const emails = students.map((s) => s.email).filter(Boolean);
    if (emails.length === 0) return;
    return sendMail({ to: emails.join(','), subject: `[EMS] Exam Updated — ${exam.title}`, html });
};

module.exports = {
    sendRegistrationEmail,
    sendRemovalEmail,
    sendExamCreatedEmail,
    sendExamCancelledEmail,
    sendResultsReleasedEmail,
    sendExamUpdatedEmail,
};
