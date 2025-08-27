// c/Users/admin/Projects/VSCodeProject/sag-web-erp/server/scripts/register-permanent-visitors.js
require('dotenv').config({ path: '../.env' }); // Adjust path to point to the server directory's .env
const mongoose = require('mongoose');
const Visitor = require('../models/visitorModel');

const permanentVisitors = [
    { licensePlate: 'SCD1809', purpose: 'Others' },             // 자판기 차량
    { licensePlate: '91296420', purpose: 'Others' },            // 덤스터 차량
    { licensePlate: 'BENORE', purpose: 'Delivery' },            // 납품차량
    { licensePlate: 'RZA', purpose: 'Delivery' },               // 납품차량
    { licensePlate: 'R794526', purpose: 'Delivery' },           // 납품차량
    { licensePlate: 'E798873', purpose: 'Delivery' },           // 납품차량
    { licensePlate: '327574', purpose: 'Delivery' },            // 납품차량
    { licensePlate: '3307913', purpose: 'Parcel Delivery' },    // 배달차량
    { licensePlate: 'DZH776', purpose: 'Parcel Delivery' },     // 배달차량
    { licensePlate: 'EIC393', purpose: 'Delivery' },            // 납품차량
    { licensePlate: 'RZK035', purpose: 'Others' },              // 지게차 수리 차량
    { licensePlate: '3023061', purpose: 'Delivery' },           // 납품차량
    { licensePlate: '027062T', purpose: 'Delivery' },           // 납품차량
    { licensePlate: '538156', purpose: 'Delivery' },            // 납품차량
    { licensePlate: '4ND3343', purpose: 'Delivery' },           // 납품차량
    { licensePlate: 'GUSA088', purpose: 'Delivery' },           // 납품차량
    { licensePlate: '5331699', purpose: 'Delivery' },           // 납품차량
    { licensePlate: '3439880', purpose: 'Delivery' },           // 납품차량
    { licensePlate: '2944221', purpose: 'Delivery' },           // 납품차량
    { licensePlate: '1N78702', purpose: 'Delivery' },           // 납품차량
];

const registerVisitors = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB connected for script.');

        const farFutureDate = new Date('9999-12-31T23:59:59Z');

        for (const visitorData of permanentVisitors) {
            const result = await Visitor.findOneAndUpdate(
                { licensePlate: visitorData.licensePlate },
                {
                    $set: {
                        purpose: visitorData.purpose,
                        visitEndDate: farFutureDate,
                        status: 'PERMANENT',
                    },
                },
                {
                    upsert: true,
                    new: true,
                    runValidators: true,
                }
            );
            console.log(`Upserted visitor: ${result.licensePlate} with purpose: ${result.purpose}`);
        }

        console.log(`\nSuccessfully processed ${permanentVisitors.length} permanent visitors.`);

    } catch (error) {
        console.error('Error during script execution:', error);
    } finally {
        await mongoose.disconnect();
        console.log('MongoDB disconnected.');
    }
};

registerVisitors();