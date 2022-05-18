const { Db } = require('mongodb');

/**
 * Prices repository
 *
 * plural used to define repositories name
 * errors are caught by using service
 */
class PricesRepository {

    /**
     *
     * @param db {Db}
     */
    constructor(db) {
        this.collection = db.collection('prices');
    }

    /**
     * @param currency {string}
     * @return {Promise<WithId<TSchema> | null>}
     */
    async getPricesByCurrency(currency) {
        return this.collection.findOne({ currency });
    }
}

module.exports = PricesRepository;
