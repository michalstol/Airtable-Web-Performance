const table = base.getTable('Foo Table'); // get Table
const settings = {
    testAmount: 20,
    pageSpeedAPIURL: `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent('https://foo-website.com/')}&category=PERFORMANCE&strategy=DESKTOP`,
    delayAPIURL: `https://httpstat.us/200?sleep=${60 * 1000}`, // seconds * miliseconds
    lastNo: (await table.selectRecordsAsync().then(({records}) => records[records.length - 1].getCellValue('No.')))
};

// A function for testing web performance
async function pageSpeedTest(testNo, delay = false) {
    const {pageSpeedAPIURL, delayAPIURL} = settings;

    if (typeof testNo !== 'number' || isNaN(testNo)) return 0;
    if (delay) await fetch(delayAPIURL); // delay between tests

    return await fetch(pageSpeedAPIURL).then(response => response.json())
    .then(async function(json) {
        if (!json || !json.lighthouseResult || !json.lighthouseResult.audits) return 0;

        const {['largest-contentful-paint']: largestPaint} = json.lighthouseResult.audits;
        const setRecord = function(name = '', score = -1) {
            return {
                fields: {
                    'Name': name,
                    'Score': score,
                    'No.': testNo
                }
            }
        };

        await table.createRecordsAsync([
            setRecord('Overall', json.lighthouseResult.categories.performance.score),
            setRecord('Largest Contentful Paint', largestPaint.score)
        ].filter(record => record.fields['Score'] !== -1));

        output.text(`test no. ${testNo} ${delay ? 'with' : 'without'} delay is done`);

        return testNo;
    });
}

// part of code responsible for counting next test's number and running tests
let counter = settings.lastNo + 1;

for (let i = 0; i < settings.testAmount; i++) {
    const testNo = await pageSpeedTest(counter, !!i);

    if (testNo === counter) counter++;
}
