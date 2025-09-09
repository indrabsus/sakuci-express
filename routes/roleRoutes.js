const express = require('express');
const router = express.Router();
const { getAllRoles, createRole } = require('../controllers/roleController');

router.get('/data', getAllRoles);
router.get('/detail/:id_role', getAllRoles)
router.post('/', createRole);

module.exports = router;