require('dotenv').config();
const express = require('express');
const app = express();
const path = require('path');
const port = process.env.PORT;
const { MongoClient } = require('mongodb');
const PricesRepository = require('./repositories/pricesRepository');
const { sortByTimestamp } = require('./helpers');
const Decimal = require('decimal.js');

let mongoClient;
(async () => {
    console.log('--- Starting...');
    mongoClient = new MongoClient(`mongodb://${process.env.MONGODB_HOST}:${process.env.MONGODB_PORT}`);
    await mongoClient.connect();
    console.log('--- Database connected');
})();

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '/public/index.html'));
});

app.get('/ratios', async (req, res) => {
    const currencyA = req.query.a.toUpperCase();
    const currencyB = req.query.b.toUpperCase();
    const mongoDb = mongoClient.db(process.env.MONGODB_DATABASE);
    const pricesRepository = new PricesRepository(mongoDb);

    const pricesAResult = await pricesRepository.getPricesByCurrency(currencyA);
    const pricesBResult = await pricesRepository.getPricesByCurrency(currencyB);
    const pricesA = sortByTimestamp(pricesAResult.prices);
    const pricesB = sortByTimestamp(pricesBResult.prices);

    const ratios = {};
    const mergedPrices = {};
    const ratiosArrTemp = [];
    const medianTemp = {};
    pricesA.reverse().forEach((a) => {
        const b = pricesB.find((b) => b.timestamp === a.timestamp);

        if (b) {
            const aPrice = new Decimal(a.price);
            const bPrice = new Decimal(b.price);

            ratios[a.timestamp] = aPrice.dividedBy(bPrice);
            mergedPrices[a.timestamp] = {
                [currencyA]: aPrice.toString(),
                [currencyB]: bPrice.toString()
            };

            let ratiosSumTemp = new Decimal(0);
            ratiosArrTemp.forEach((num) => {
                ratiosSumTemp = ratiosSumTemp.plus(num);
            });
            ratiosArrTemp.push(ratios[a.timestamp]);
            if (ratiosArrTemp.length > 21) {
                medianTemp[a.timestamp] = ratiosSumTemp.dividedBy(ratiosArrTemp.length);
            }
        }
    });
    const ratiosArr = Object.values(ratios).map((ratio) => new Decimal(ratio));
    const count = ratiosArr.length;
    let ratiosSum = new Decimal(0);
    ratiosArr.forEach((num) => {
        ratiosSum = ratiosSum.plus(num);
    });

    const median = ratiosSum.dividedBy(count);

    res.json({
        ratios,
        median,
        medians: medianTemp
    });
});

app.listen(port, () => {
    console.log(`Listening on port: ${port}`)
});