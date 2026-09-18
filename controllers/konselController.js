const { sequelize } = require('../models');

// Helper generator CUID-like ID
function generateId(prefix = '') {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 9);
  return `${prefix}${timestamp}${randomStr}`;
}


// Helper otomatis menutup sesi konseling yang tidak aktif >= 2 jam
const autoCloseInactiveSessions = async () => {
  try {
    await sequelize.query(
      "UPDATE konsel_ai.CounselingSession SET status = 'CLOSED' WHERE status = 'ACTIVE' AND TIMESTAMPDIFF(HOUR, updatedAt, NOW()) >= 2"
    );
  } catch (err) {
    console.error('Error auto-closing inactive sessions:', err);
  }
};

// 1. GET /api/konsel/stats
const getStats = async (req, res) => {
  try {
    await autoCloseInactiveSessions();
    const [[{ totalSessions }]] = await sequelize.query(
      'SELECT COUNT(*) as totalSessions FROM konsel_ai.CounselingSession'
    );
    const [[{ activeSessions }]] = await sequelize.query(
      "SELECT COUNT(*) as activeSessions FROM konsel_ai.CounselingSession WHERE status = 'ACTIVE'"
    );
    const [[{ totalStudents }]] = await sequelize.query(
      "SELECT COUNT(*) as totalStudents FROM zakola_id.siswa_ppdb WHERE status = 'aktif'"
    );
    const [[{ countHijau }]] = await sequelize.query(
      "SELECT COUNT(*) as countHijau FROM konsel_ai.CounselingSession WHERE triageLevel = 'HIJAU'"
    );
    const [[{ countKuning }]] = await sequelize.query(
      "SELECT COUNT(*) as countKuning FROM konsel_ai.CounselingSession WHERE triageLevel = 'KUNING'"
    );
    const [[{ countMerah }]] = await sequelize.query(
      "SELECT COUNT(*) as countMerah FROM konsel_ai.CounselingSession WHERE triageLevel = 'MERAH'"
    );
    const [[{ countPendingAction }]] = await sequelize.query(
      "SELECT COUNT(*) as countPendingAction FROM konsel_ai.CounselingSession WHERE handlingStatus = 'MENUNGGU' AND triageLevel IN ('KUNING', 'MERAH')"
    );

    // Kasus Kritis / Darurat (MERAH)
    const [urgentRows] = await sequelize.query(`
      SELECT cs.*, 
        s.name as student_name, s.nisn as student_nisn, s.class as student_class,
        s.major as student_major, s.phone as student_phone, s.parentPhone as student_parentPhone
      FROM konsel_ai.CounselingSession cs
      LEFT JOIN konsel_ai.Student s ON cs.studentId = s.id
      WHERE cs.triageLevel = 'MERAH'
      ORDER BY cs.createdAt DESC
      LIMIT 10
    `);

    const urgentCases = urgentRows.map(row => ({
      id: row.id,
      studentId: row.studentId,
      status: row.status,
      triageLevel: row.triageLevel,
      triageReason: row.triageReason,
      counselorNotes: row.counselorNotes,
      handlingStatus: row.handlingStatus,
      summary: row.summary,
      notifiedGuruBk: Boolean(row.notifiedGuruBk),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      student: {
        id: row.studentId,
        nisn: row.student_nisn,
        name: row.student_name,
        class: row.student_class,
        major: row.student_major,
        phone: row.student_phone,
        parentPhone: row.student_parentPhone,
      },
    }));

    // Sesi Konseling Terbaru
    const [recentRows] = await sequelize.query(`
      SELECT cs.*, 
        s.name as student_name, s.nisn as student_nisn, s.class as student_class,
        s.major as student_major, s.phone as student_phone, s.parentPhone as student_parentPhone
      FROM konsel_ai.CounselingSession cs
      LEFT JOIN konsel_ai.Student s ON cs.studentId = s.id
      ORDER BY cs.createdAt DESC
      LIMIT 8
    `);

    const recentSessions = recentRows.map(row => ({
      id: row.id,
      studentId: row.studentId,
      status: row.status,
      triageLevel: row.triageLevel,
      triageReason: row.triageReason,
      counselorNotes: row.counselorNotes,
      handlingStatus: row.handlingStatus,
      summary: row.summary,
      notifiedGuruBk: Boolean(row.notifiedGuruBk),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      student: {
        id: row.studentId,
        nisn: row.student_nisn,
        name: row.student_name,
        class: row.student_class,
        major: row.student_major,
        phone: row.student_phone,
        parentPhone: row.student_parentPhone,
      },
      messages: [],
    }));

    return res.json({
      success: true,
      stats: {
        totalSessions: Number(totalSessions),
        activeSessions: Number(activeSessions),
        totalStudents: Number(totalStudents),
        countHijau: Number(countHijau),
        countKuning: Number(countKuning),
        countMerah: Number(countMerah),
        countPendingAction: Number(countPendingAction),
      },
      urgentCases,
      recentSessions,
    });
  } catch (error) {
    console.error('Error in getStats:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 2. GET /api/konsel/sessions
const getSessions = async (req, res) => {
  try {
    await autoCloseInactiveSessions();
    const { triage, status, search } = req.query;

    let whereClauses = [];
    let replacements = [];

    if (triage && triage !== 'ALL') {
      whereClauses.push('cs.triageLevel = ?');
      replacements.push(triage);
    }

    if (status && status !== 'ALL') {
      whereClauses.push('cs.status = ?');
      replacements.push(status);
    }

    if (search) {
      whereClauses.push('(s.name LIKE ? OR s.nisn LIKE ? OR s.class LIKE ?)');
      const q = `%${search}%`;
      replacements.push(q, q, q);
    }

    const whereSQL = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const query = `
      SELECT cs.*, 
        s.name as student_name, s.nisn as student_nisn, s.class as student_class,
        s.major as student_major, s.phone as student_phone, s.parentPhone as student_parentPhone,
        (SELECT COUNT(*) FROM konsel_ai.ChatMessage cm WHERE cm.sessionId = cs.id) as messageCount
      FROM konsel_ai.CounselingSession cs
      LEFT JOIN konsel_ai.Student s ON cs.studentId = s.id
      ${whereSQL}
      ORDER BY cs.createdAt DESC
      LIMIT 100
    `;

    const [rows] = await sequelize.query(query, { replacements });

    const sessions = rows.map(row => ({
      id: row.id,
      studentId: row.studentId,
      status: row.status,
      triageLevel: row.triageLevel,
      triageReason: row.triageReason,
      counselorNotes: row.counselorNotes,
      handlingStatus: row.handlingStatus,
      summary: row.summary,
      notifiedGuruBk: Boolean(row.notifiedGuruBk),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      _count: {
        messages: Number(row.messageCount || 0),
      },
      student: {
        id: row.studentId,
        nisn: row.student_nisn,
        name: row.student_name,
        class: row.student_class,
        major: row.student_major,
        phone: row.student_phone,
        parentPhone: row.student_parentPhone,
      },
      messages: [],
    }));

    return res.json({ success: true, sessions });
  } catch (error) {
    console.error('Error in getSessions:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 3. GET /api/konsel/sessions/:id
const getSessionDetail = async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await sequelize.query(
      `SELECT cs.*, 
        s.name as student_name, s.nisn as student_nisn, s.class as student_class,
        s.major as student_major, s.phone as student_phone, s.parentPhone as student_parentPhone
      FROM konsel_ai.CounselingSession cs
      LEFT JOIN konsel_ai.Student s ON cs.studentId = s.id
      WHERE cs.id = ?`,
      { replacements: [id] }
    );

    if (!rows || rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Sesi konseling tidak ditemukan.' });
    }

    const row = rows[0];

    // Ambil seluruh chat message dalam sesi
    const [messages] = await sequelize.query(
      `SELECT * FROM konsel_ai.ChatMessage WHERE sessionId = ? ORDER BY createdAt ASC`,
      { replacements: [id] }
    );

    const session = {
      id: row.id,
      studentId: row.studentId,
      status: row.status,
      triageLevel: row.triageLevel,
      triageReason: row.triageReason,
      counselorNotes: row.counselorNotes,
      handlingStatus: row.handlingStatus,
      summary: row.summary,
      notifiedGuruBk: Boolean(row.notifiedGuruBk),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      student: {
        id: row.studentId,
        nisn: row.student_nisn,
        name: row.student_name,
        class: row.student_class,
        major: row.student_major,
        phone: row.student_phone,
        parentPhone: row.student_parentPhone,
      },
      messages: messages.map(m => ({
        id: m.id,
        sessionId: m.sessionId,
        sender: m.sender,
        message: m.message,
        triageFlag: m.triageFlag,
        createdAt: m.createdAt,
      })),
    };

    return res.json({ success: true, session });
  } catch (error) {
    console.error('Error in getSessionDetail:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 4. POST /api/konsel/sessions
const createSession = async (req, res) => {
  try {
    const { studentId, status = 'ACTIVE', triageLevel = 'HIJAU', triageReason = null, handlingStatus = 'MENUNGGU', summary = null } = req.body;

    if (!studentId) {
      return res.status(400).json({ success: false, message: 'studentId wajib diisi.' });
    }

    const id = generateId('sess_');
    const now = new Date();

    await sequelize.query(
      `INSERT INTO konsel_ai.CounselingSession 
       (id, studentId, status, triageLevel, triageReason, handlingStatus, summary, notifiedGuruBk, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?)`,
      { replacements: [id, studentId, status, triageLevel, triageReason, handlingStatus, summary, now, now] }
    );

    return res.json({
      success: true,
      message: 'Sesi konseling berhasil dibuat.',
      session: {
        id,
        studentId,
        status,
        triageLevel,
        triageReason,
        handlingStatus,
        summary,
        notifiedGuruBk: false,
        createdAt: now,
        updatedAt: now,
      },
    });
  } catch (error) {
    console.error('Error in createSession:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 5. PUT /api/konsel/sessions/:id
const updateSession = async (req, res) => {
  try {
    const { id } = req.params;
    const { triageLevel, triageReason, counselorNotes, handlingStatus, summary, status, notifiedGuruBk } = req.body;

    let updates = [];
    let replacements = [];

    if (triageLevel !== undefined) {
      updates.push('triageLevel = ?');
      replacements.push(triageLevel);
    }
    if (triageReason !== undefined) {
      updates.push('triageReason = ?');
      replacements.push(triageReason);
    }
    if (counselorNotes !== undefined) {
      updates.push('counselorNotes = ?');
      replacements.push(counselorNotes);
    }
    if (handlingStatus !== undefined) {
      updates.push('handlingStatus = ?');
      replacements.push(handlingStatus);
      if (handlingStatus === 'SELESAI' && status === undefined) {
        updates.push('status = ?');
        replacements.push('CLOSED');
      }
    }
    if (summary !== undefined) {
      updates.push('summary = ?');
      replacements.push(summary);
    }
    if (status !== undefined) {
      updates.push('status = ?');
      replacements.push(status);
    }
    if (notifiedGuruBk !== undefined) {
      updates.push('notifiedGuruBk = ?');
      replacements.push(notifiedGuruBk ? 1 : 0);
    }

    if (updates.length === 0) {
      return res.json({ success: true, message: 'Tidak ada perubahan.' });
    }

    updates.push('updatedAt = NOW()');
    replacements.push(id);

    await sequelize.query(
      `UPDATE konsel_ai.CounselingSession SET ${updates.join(', ')} WHERE id = ?`,
      { replacements }
    );

    return res.json({ success: true, message: 'Sesi konseling berhasil diperbarui.' });
  } catch (error) {
    console.error('Error in updateSession:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 6. POST /api/konsel/messages
const addMessage = async (req, res) => {
  try {
    const { sessionId, sender, message, triageFlag = null } = req.body;

    if (!sessionId || !sender || !message) {
      return res.status(400).json({ success: false, message: 'sessionId, sender, dan message wajib diisi.' });
    }

    const id = generateId('msg_');
    const now = new Date();

    await sequelize.query(
      `INSERT INTO konsel_ai.ChatMessage (id, sessionId, sender, message, triageFlag, createdAt)
       VALUES (?, ?, ?, ?, ?, ?)`,
      { replacements: [id, sessionId, sender, message, triageFlag, now] }
    );

    await sequelize.query(
      `UPDATE konsel_ai.CounselingSession SET updatedAt = NOW() WHERE id = ?`,
      { replacements: [sessionId] }
    );

    return res.json({
      success: true,
      message: 'Pesan berhasil disimpan.',
      chatMessage: {
        id,
        sessionId,
        sender,
        message,
        triageFlag,
        createdAt: now,
      },
    });
  } catch (error) {
    console.error('Error in addMessage:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 7. GET /api/konsel/students
const getStudents = async (req, res) => {
  try {
    const { search = '', page = 1, limit = 0, class: classFilter = '', major: majorFilter = '' } = req.query;

    let whereConditions = ["sp.status = 'aktif'"];
    let replacements = [];

    if (search) {
      whereConditions.push(`(
        sp.nama_lengkap LIKE ? 
        OR sp.username LIKE ? 
        OR sp.nisn LIKE ? 
        OR rk.nama_kelas LIKE ? 
        OR CONCAT('X ', rk.nama_kelas) LIKE ? 
        OR CONCAT('XI ', rk.nama_kelas) LIKE ? 
        OR CONCAT('XII ', rk.nama_kelas) LIKE ? 
        OR sp.no_hp LIKE ?
      )`);
      const q = `%${search}%`;
      replacements.push(q, q, q, q, q, q, q, q);
    }

    if (classFilter && classFilter !== 'ALL') {
      whereConditions.push(`(
        CASE rk.tingkat
          WHEN '10' THEN CONCAT('X ', rk.nama_kelas)
          WHEN '11' THEN CONCAT('XI ', rk.nama_kelas)
          WHEN '12' THEN CONCAT('XII ', rk.nama_kelas)
          ELSE CONCAT(rk.tingkat, ' ', rk.nama_kelas)
        END = ? OR rk.nama_kelas = ?
      )`);
      replacements.push(classFilter, classFilter);
    }

    if (majorFilter && majorFilter !== 'ALL') {
      whereConditions.push(`(
        CASE
          WHEN rk.nama_kelas LIKE 'PPLG%' OR rk.nama_kelas LIKE 'RPL%' THEN 'PPLG'
          WHEN rk.nama_kelas LIKE 'AKL%' OR rk.nama_kelas LIKE 'AK%' THEN 'AKL'
          WHEN rk.nama_kelas LIKE 'MPLB%' THEN 'MPLB'
          WHEN rk.nama_kelas LIKE 'PM%' OR rk.nama_kelas LIKE 'BR%' OR rk.nama_kelas LIKE 'BDP%' THEN 'PM'
          ELSE '-'
        END = ? OR (
          CASE
            WHEN rk.nama_kelas LIKE 'PPLG%' OR rk.nama_kelas LIKE 'RPL%' THEN 'Pengembangan Perangkat Lunak dan Gim'
            WHEN rk.nama_kelas LIKE 'AKL%' OR rk.nama_kelas LIKE 'AK%' THEN 'Akuntansi dan Keuangan Lembaga'
            WHEN rk.nama_kelas LIKE 'MPLB%' THEN 'Manajemen Perkantoran dan Layanan Bisnis'
            WHEN rk.nama_kelas LIKE 'PM%' OR rk.nama_kelas LIKE 'BR%' OR rk.nama_kelas LIKE 'BDP%' THEN 'Pemasaran'
            ELSE '-'
          END = ?
        )
      )`);
      replacements.push(majorFilter, majorFilter);
    }

    const whereSQL = 'WHERE ' + whereConditions.join(' AND ');

    const countReplacements = [...replacements];
    const [[{ total }]] = await sequelize.query(
      `SELECT COUNT(DISTINCT sp.id_siswa) as total 
       FROM zakola_id.siswa_ppdb sp
       JOIN zakola_id.riwayat_kelas rk ON sp.id_siswa = rk.id_siswa
       JOIN zakola_id.tahun_ajaran ta ON (rk.id_tahun_ajaran = ta.id_tahun_ajaran AND ta.is_aktif = 1)
       ${whereSQL}`,
      { replacements: countReplacements }
    );

    let limitClause = '';
    const numLimit = Number(limit);
    const numPage = Math.max(1, Number(page));

    if (numLimit > 0) {
      const offset = (numPage - 1) * numLimit;
      limitClause = `LIMIT ? OFFSET ?`;
      replacements.push(numLimit, offset);
    }

    const [rawStudents] = await sequelize.query(
      `SELECT 
         CONCAT('stu_', sp.id_siswa) as id,
         sp.id_siswa,
         sp.nisn,
         sp.username,
         sp.nama_lengkap as name,
         CASE rk.tingkat
           WHEN '10' THEN CONCAT('X ', rk.nama_kelas)
           WHEN '11' THEN CONCAT('XI ', rk.nama_kelas)
           WHEN '12' THEN CONCAT('XII ', rk.nama_kelas)
           ELSE CONCAT(rk.tingkat, ' ', rk.nama_kelas)
         END as class,
         rk.tingkat,
         rk.nama_kelas,
         CASE
           WHEN rk.nama_kelas LIKE 'PPLG%' OR rk.nama_kelas LIKE 'RPL%' THEN 'Pengembangan Perangkat Lunak dan Gim'
           WHEN rk.nama_kelas LIKE 'AKL%' OR rk.nama_kelas LIKE 'AK%' THEN 'Akuntansi dan Keuangan Lembaga'
           WHEN rk.nama_kelas LIKE 'MPLB%' THEN 'Manajemen Perkantoran dan Layanan Bisnis'
           WHEN rk.nama_kelas LIKE 'PM%' OR rk.nama_kelas LIKE 'BR%' OR rk.nama_kelas LIKE 'BDP%' THEN 'Pemasaran'
           ELSE '-'
         END as major,
         CASE
           WHEN rk.nama_kelas LIKE 'PPLG%' OR rk.nama_kelas LIKE 'RPL%' THEN 'PPLG'
           WHEN rk.nama_kelas LIKE 'AKL%' OR rk.nama_kelas LIKE 'AK%' THEN 'AKL'
           WHEN rk.nama_kelas LIKE 'MPLB%' THEN 'MPLB'
           WHEN rk.nama_kelas LIKE 'PM%' OR rk.nama_kelas LIKE 'BR%' OR rk.nama_kelas LIKE 'BDP%' THEN 'PM'
           ELSE '-'
         END as kode_jurusan,
         sp.no_hp as phone,
         sp.no_hp_ortu as parentPhone,
         sp.created_at as createdAt,
         sp.updated_at as updatedAt,
         (SELECT COUNT(*) FROM konsel_ai.counselingsession cs 
          WHERE cs.studentId = CONCAT('stu_', sp.id_siswa) OR cs.studentId = st.id) as sessionCount
       FROM zakola_id.siswa_ppdb sp
       JOIN zakola_id.riwayat_kelas rk ON sp.id_siswa = rk.id_siswa
       JOIN zakola_id.tahun_ajaran ta ON (rk.id_tahun_ajaran = ta.id_tahun_ajaran AND ta.is_aktif = 1)
       LEFT JOIN konsel_ai.student st ON (st.username = sp.username)
       ${whereSQL}
       GROUP BY sp.id_siswa
       ORDER BY rk.tingkat ASC, rk.nama_kelas ASC, sp.nama_lengkap ASC
       ${limitClause}`,
      { replacements }
    );

    const students = rawStudents.map((s) => ({
      id: s.id,
      nisn: s.nisn,
      username: s.username,
      name: s.name,
      class: s.class,
      tingkat: s.tingkat,
      nama_kelas: s.nama_kelas,
      major: s.major,
      kodeJurusan: s.kode_jurusan,
      phone: s.phone,
      parentPhone: s.parentPhone,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
      _count: {
        sessions: Number(s.sessionCount || 0),
      },
    }));

    return res.json({
      success: true,
      students,
      pagination: {
        total: Number(total),
        page: numPage,
        limit: numLimit,
        totalPages: numLimit > 0 ? Math.ceil(Number(total) / numLimit) : 1,
      },
    });
  } catch (error) {
    console.error('Error in getStudents:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 8. POST /api/konsel/students/auth-find
const findStudentForBot = async (req, res) => {
  try {
    await autoCloseInactiveSessions();
    const { username, phone } = req.body;
    if (!username) {
      return res.status(400).json({ success: false, message: 'username wajib diisi.' });
    }

    const inputUser = String(username).trim();

    const [rows] = await sequelize.query(
      `SELECT * FROM konsel_ai.student WHERE username = ? OR nisn = ? LIMIT 1`,
      { replacements: [inputUser, inputUser] }
    );

    let student = rows.length > 0 ? rows[0] : null;

    if (!student) {
      const [ppdbRows] = await sequelize.query(
        `SELECT sp.id_siswa, sp.nama_lengkap, sp.nisn, sp.username, sp.password, sp.no_hp, sp.no_hp_ortu,
                CASE rk.tingkat
                  WHEN '10' THEN CONCAT('X ', rk.nama_kelas)
                  WHEN '11' THEN CONCAT('XI ', rk.nama_kelas)
                  WHEN '12' THEN CONCAT('XII ', rk.nama_kelas)
                  ELSE COALESCE(rk.nama_kelas, 'Siswa Sakuci')
                END as class,
                CASE
                  WHEN rk.nama_kelas LIKE 'PPLG%' OR rk.nama_kelas LIKE 'RPL%' THEN 'Pengembangan Perangkat Lunak dan Gim'
                  WHEN rk.nama_kelas LIKE 'AKL%' OR rk.nama_kelas LIKE 'AK%' THEN 'Akuntansi dan Keuangan Lembaga'
                  WHEN rk.nama_kelas LIKE 'MPLB%' THEN 'Manajemen Perkantoran dan Layanan Bisnis'
                  WHEN rk.nama_kelas LIKE 'PM%' OR rk.nama_kelas LIKE 'BR%' OR rk.nama_kelas LIKE 'BDP%' THEN 'Pemasaran'
                  ELSE '-'
                END as major
         FROM zakola_id.siswa_ppdb sp
         LEFT JOIN zakola_id.riwayat_kelas rk ON sp.id_siswa = rk.id_siswa
         LEFT JOIN zakola_id.tahun_ajaran ta ON (rk.id_tahun_ajaran = ta.id_tahun_ajaran AND ta.is_aktif = 1)
         WHERE sp.username = ? OR sp.nisn = ?
         ORDER BY ta.is_aktif DESC, rk.created_at DESC
         LIMIT 1`,
        { replacements: [inputUser, inputUser] }
      );

      const id = ppdbRows.length > 0 ? `stu_${ppdbRows[0].id_siswa}` : generateId('stu_');
      const studentName = ppdbRows.length > 0 ? ppdbRows[0].nama_lengkap : inputUser;
      const studentClass = ppdbRows.length > 0 ? ppdbRows[0].class : 'Siswa Sakuci';
      const studentMajor = ppdbRows.length > 0 ? ppdbRows[0].major : '-';
      const studentNisn = ppdbRows.length > 0 ? (ppdbRows[0].nisn || inputUser) : inputUser;
      const studentPass = ppdbRows.length > 0 ? (ppdbRows[0].password || '$2y$10$T37wZbFAVv7.F2DQ5xf7CeHN4jW8anTqI3OnIR.tezKHjZGVRRvvm') : '$2y$10$T37wZbFAVv7.F2DQ5xf7CeHN4jW8anTqI3OnIR.tezKHjZGVRRvvm';
      const studentPhone = phone || (ppdbRows.length > 0 ? ppdbRows[0].no_hp : null);
      const parentPhone = ppdbRows.length > 0 ? ppdbRows[0].no_hp_ortu : null;

      const now = new Date();
      await sequelize.query(
        `INSERT INTO konsel_ai.student (id, nisn, username, name, class, major, password, phone, parentPhone, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE name = VALUES(name), class = VALUES(class), major = VALUES(major), updatedAt = NOW()`,
        { replacements: [id, studentNisn, inputUser, studentName, studentClass, studentMajor, studentPass, studentPhone, parentPhone, now, now] }
      );

      student = {
        id,
        nisn: studentNisn,
        username: inputUser,
        name: studentName,
        class: studentClass,
        major: studentMajor,
        phone: studentPhone,
      };
    } else if (phone && (!student.phone || student.phone !== phone)) {
      await sequelize.query(
        `UPDATE konsel_ai.student SET phone = ?, updatedAt = NOW() WHERE id = ?`,
        { replacements: [phone, student.id] }
      );
      student.phone = phone;
    }

    const [activeSessions] = await sequelize.query(
      `SELECT * FROM konsel_ai.counselingsession WHERE studentId = ? AND status = 'ACTIVE' ORDER BY createdAt DESC LIMIT 1`,
      { replacements: [student.id] }
    );

    let session = activeSessions.length > 0 ? activeSessions[0] : null;
    let isNewSession = false;

    if (!session) {
      const sessId = generateId('sess_');
      const now = new Date();
      await sequelize.query(
        `INSERT INTO konsel_ai.counselingsession (id, studentId, status, triageLevel, handlingStatus, notifiedGuruBk, createdAt, updatedAt)
         VALUES (?, ?, 'ACTIVE', 'HIJAU', 'MENUNGGU', 0, ?, ?)`,
        { replacements: [sessId, student.id, now, now] }
      );
      session = {
        id: sessId,
        studentId: student.id,
        status: 'ACTIVE',
        triageLevel: 'HIJAU',
        handlingStatus: 'MENUNGGU',
        notifiedGuruBk: 0,
        createdAt: now,
      };
      isNewSession = true;
    }

    return res.json({
      success: true,
      student,
      session,
      isNewSession,
    });
  } catch (error) {
    console.error('Error in findStudentForBot:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 9. POST /api/konsel/notifications
const saveNotificationLog = async (req, res) => {
  try {
    const { sessionId = null, recipient, message, status = 'SENT', response = null } = req.body;
    const id = generateId('notif_');
    const now = new Date();

    await sequelize.query(
      `INSERT INTO konsel_ai.NotificationLog (id, sessionId, recipient, message, status, response, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      { replacements: [id, sessionId, recipient, message, status, response, now] }
    );

    return res.json({ success: true, id });
  } catch (error) {
    console.error('Error in saveNotificationLog:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};


// 10. POST /api/konsel/students/reset-password
const resetStudentPassword = async (req, res) => {
  try {
    const { username, id } = req.body;
    if (!username && !id) {
      return res.status(400).json({ success: false, message: "username atau id siswa wajib diisi." });
    }

    const defaultHash = "$2y$10$T37wZbFAVv7.F2DQ5xf7CeHN4jW8anTqI3OnIR.tezKHjZGVRRvvm"; // bcrypt hash 123456

    if (username) {
      await sequelize.query(
        "UPDATE zakola_id.siswa_ppdb SET password = ? WHERE username = ?",
        { replacements: [defaultHash, username] }
      );
      await sequelize.query(
        "UPDATE konsel_ai.Student SET password = ? WHERE username = ?",
        { replacements: [defaultHash, username] }
      );
    } else if (id) {
      await sequelize.query(
        "UPDATE zakola_id.siswa_ppdb SET password = ? WHERE id_siswa = ?",
        { replacements: [defaultHash, id] }
      );
      await sequelize.query(
        "UPDATE konsel_ai.Student SET password = ? WHERE id = ?",
        { replacements: [defaultHash, id] }
      );
    }

    return res.json({
      success: true,
      message: "Kata sandi berhasil di-reset ke default: 123456.",
    });
  } catch (error) {
    console.error("Error in resetStudentPassword:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 11. GET /api/konsel/settings
const getSettings = async (req, res) => {
  try {
    const [rows] = await sequelize.query(
      "SELECT `key`, `value`, `description`, `updatedAt` FROM konsel_ai.SystemSetting"
    );

    const settings = {
      WA_GATEWAY_URL: "https://bot.smksangkuriang1cimahi.sch.id/wa/kirim",
      WA_GATEWAY_TOKEN: "",
      WA_GURU_BK_NUMBER: "081234567890",
      NOTIF_ALERT_LEVEL: "ALL",
      OLLAMA_BASE_URL: "https://ai.smksangkuriang1cimahi.sch.id",
      OLLAMA_MODEL: "qwen2.5:7b",
      SAKUCI_API_URL: "https://eks.smksangkuriang1cimahi.sch.id",
    };

    rows.forEach(r => {
      settings[r.key] = r.value;
    });

    const [logs] = await sequelize.query(
      "SELECT * FROM konsel_ai.NotificationLog ORDER BY createdAt DESC LIMIT 25"
    );

    return res.json({
      success: true,
      settings,
      notificationLogs: logs || [],
    });
  } catch (error) {
    console.error("Error in getSettings:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 12. POST /api/konsel/settings
const saveSettings = async (req, res) => {
  try {
    const { settings = {} } = req.body;
    const now = new Date();

    const entries = Object.entries(settings);
    for (const [key, value] of entries) {
      if (!key) continue;
      const id = generateId("set_");
      await sequelize.query(
        `INSERT INTO konsel_ai.SystemSetting (\`id\`, \`key\`, \`value\`, \`updatedAt\`)
         VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE \`value\` = VALUES(\`value\`), \`updatedAt\` = VALUES(\`updatedAt\`)`,
        { replacements: [id, key, String(value ?? ""), now] }
      );
    }

    return res.json({
      success: true,
      message: "Pengaturan sistem berhasil disimpan ke basis data.",
    });
  } catch (error) {
    console.error("Error in saveSettings:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getStats,
  getSessions,
  getSessionDetail,
  createSession,
  updateSession,
  addMessage,
  getStudents,
  findStudentForBot,
  saveNotificationLog,
  resetStudentPassword,
  getSettings,
  saveSettings,
};

