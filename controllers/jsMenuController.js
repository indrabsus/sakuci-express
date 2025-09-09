const {JsMenu, JsSubMenu, Role} = require('../models')

const dataMenu = async (req, res) => {
  try {
    const { id_sub_menu } = req.params;

    if (id_sub_menu) {
      // kalau ada id_menu, ambil detail satu
      const menu = await JsMenu.findOne({
        include: [{
          model: JsSubMenu, as: 'sub_menu',
          where: {id_sub_menu},
          include: [{ model: Role, as: 'role' }]
        }]
      });

      if (!menu) {
        return res.status(404).json({
          status: 'error',
          message: 'Menu tidak ditemukan.'
        });
      }

      return res.status(200).json({
        status: 'success',
        message: 'Detail menu berhasil diambil.',
        data: menu
      });
    }

    // kalau tidak ada id_menu, ambil semua
    const menus = await JsMenu.findAll({
      include: [{
        model: JsSubMenu, as: 'sub_menu',
        include: [{ model: Role, as: 'role' }]
      }]
    });

    res.status(200).json({
      status: 'success',
      message: 'Data menu berhasil diambil.',
      data: menus
    });

  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Gagal mengambil data menu.',
      error: error.message,
    });
  }
};

const parentMenu = async (req, res) => {
  try {
    const { id_menu } = req.params;

    if (id_menu) {
      // detail
      const menu = await JsMenu.findOne({ where: { id_menu } });

      if (!menu) {
        return res.status(404).json({
          status: 'error',
          message: 'Menu tidak ditemukan.'
        });
      }

      return res.status(200).json({
        status: 'success',
        message: 'Detail menu berhasil diambil.',
        data: menu,
      });
    }

    // semua data
    const menus = await JsMenu.findAll();
    res.status(200).json({
      status: 'success',
      message: 'Data semua menu berhasil diambil.',
      data: menus,
    });

  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Gagal mengambil data menu.',
      error: error.message,
    });
  }
};

const createParent = async(req, res) => {
    const { label, icon } = req.body;
    try{
        const data = await JsMenu.create({
            label, icon
        })
        if(!data){
            res.status(400).json({
                status: 'error',
                message: 'gagal menambahkan data!'
            })
        } else {
            res.status(200).json({
                status: 'success',
                message: 'berhasil menambahkan data!',
                data
            })
        }
    } catch(error){
        res.status(500).json({
            status: 'gagal',
            message: 'gagal mengambil data!',
            error: error.message
        })
    }
}

const updateParent = async (req, res) => {
    const { id_menu } = req.params; // ambil id dari URL
    const { label, icon } = req.body;

    try {
        const data = await JsMenu.findByPk(id_menu);

        if (!data) {
            return res.status(404).json({
                status: 'error',
                message: 'data tidak ditemukan!'
            });
        }

        // update data
        await data.update({ label, icon });

        res.status(200).json({
            status: 'success',
            message: 'berhasil mengupdate data!',
            data
        });
    } catch (error) {
        res.status(500).json({
            status: 'gagal',
            message: 'gagal mengupdate data!',
            error: error.message
        });
    }
};

const deleteParent = async (req, res) => {
    const { id_menu } = req.params;

    try {
        const data = await JsMenu.findByPk(id_menu);

        if (!data) {
            return res.status(404).json({
                status: 'error',
                message: 'data tidak ditemukan!'
            });
        }

        await data.destroy();

        res.status(200).json({
            status: 'success',
            message: 'berhasil menghapus data!'
        });
    } catch (error) {
        res.status(500).json({
            status: 'gagal',
            message: 'gagal menghapus data!',
            error: error.message
        });
    }
};

const createMenu = async(req, res) => {
    const { sublabel, href, id_role, id_menu } = req.body;
    try{
        const data = await JsSubMenu.create({
            id_menu, id_role, sublabel, href
        })
        if(!data){
            res.status(400).json({
                status: 'error',
                message: 'gagal menambahkan data!'
            })
        } else {
            res.status(200).json({
                status: 'success',
                message: 'berhasil menambahkan data!',
                data
            })
        }
    } catch(error){
        res.status(500).json({
            status: 'gagal',
            message: 'gagal mengambil data!',
            error: error.message
        })
    }
}

const updateMenu = async (req, res) => {
    const { id_sub_menu } = req.params; // ambil id dari URL
    const { sublabel, href, id_role, id_menu } = req.body;

    try {
        const data = await JsSubMenu.findByPk(id_sub_menu);

        if (!data) {
            return res.status(404).json({
                status: 'error',
                message: 'data tidak ditemukan!'
            });
        }

        // update data
        await data.update({ id_menu, id_role, sublabel, href });

        res.status(200).json({
            status: 'success',
            message: 'berhasil mengupdate data!',
            data
        });
    } catch (error) {
        res.status(500).json({
            status: 'gagal',
            message: 'gagal mengupdate data!',
            error: error.message
        });
    }
};

const deleteMenu = async (req, res) => {
    const { id_sub_menu } = req.params;

    try {
        const data = await JsSubMenu.findByPk(id_sub_menu);

        if (!data) {
            return res.status(404).json({
                status: 'error',
                message: 'data tidak ditemukan!'
            });
        }

        await data.destroy();

        res.status(200).json({
            status: 'success',
            message: 'berhasil menghapus data!'
        });
    } catch (error) {
        res.status(500).json({
            status: 'gagal',
            message: 'gagal menghapus data!',
            error: error.message
        });
    }
};

module.exports = {
  dataMenu, parentMenu, createParent, updateParent, deleteParent, createMenu, updateMenu, deleteMenu
};