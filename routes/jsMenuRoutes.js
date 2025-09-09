const express = require('express');
const { dataMenu, parentMenu, createParent, updateParent, deleteParent, createMenu, updateMenu, deleteMenu } = require('../controllers/jsMenuController');
const router = express.Router();
const proteksi = require('../middleware/authMiddleware'); // Import middleware untuk verifikasi JWT

router.get('/data', proteksi, dataMenu);
router.get('/data/:id_sub_menu', proteksi, dataMenu);
router.get('/dataparent',proteksi, parentMenu);
router.get('/dataparent/:id_menu',proteksi, parentMenu);
router.post('/createparent',proteksi, createParent)
router.post('/createmenu',proteksi, createMenu)
router.put('/updateparent/:id_menu',proteksi, updateParent)
router.put('/updatemenu/:id_sub_menu',proteksi, updateMenu)
router.delete('/deleteparent/:id_menu',proteksi, deleteParent);
router.delete('/deletemenu/:id_sub_menu',proteksi, deleteMenu)

module.exports = router;