const express = require('express');
const router = express.Router();
const { getAllRoles, createRole, updateRole, deleteRole, userData, updateUser, deleteUser, createUser, resetPassword } = require('../controllers/roleController');

router.get('/data/:id_role?', getAllRoles);
router.get('/user/:id?', userData);
router.post('/create', createRole);
router.post('/createuser', createUser);
router.put('/update/:id_role', updateRole);
router.put('/updateuser/:id', updateUser);
router.put('/resetpassword/:id', resetPassword);
router.delete('/delete/:id_role', deleteRole);
router.delete('/deleteuser/:id', deleteUser);

module.exports = router;