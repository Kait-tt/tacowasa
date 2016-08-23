const db = require('../../lib/schemes');
const Model = db.Sequelize.Model;

module.exports = {
    clean: () => {
        return Promise.all(
            Object.keys(db)
                .map(key => db[key])
                .filter(x => x instanceof Model)
                .map(x => x.destroy({where: {}}))
        )
    }
};