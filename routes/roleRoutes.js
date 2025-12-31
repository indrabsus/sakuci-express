const express = require('express');
const router = express.Router();
const { getAllRoles, createRole, updateRole, deleteRole } = require('../controllers/roleController');

router.get('/data/:id_role?', getAllRoles);
router.post('/create', createRole);
router.put('/update/:id_role', updateRole);
router.delete('/delete/:id_role', deleteRole);

module.exports = router;