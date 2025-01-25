const express = require('express');
const router = express.Router();
const { getAllRoles, createRole } = require('../controllers/roleController');

router.get('/', getAllRoles);
router.post('/', createRole);

module.exports = router;