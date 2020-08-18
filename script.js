const table = base.getTable('Foo Table'); // get Table
const settings = {
    testAmount: 20,
    pageSpeedAPIURL: `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent('https://foo-website.com/')}&category=PERFORMANCE&strategy=DESKTOP`,
    delayAPIURL: `https://httpstat.us/200?sleep=${60 * 1000}`, // seconds * miliseconds
    lastNo: (await table.selectRecordsAsync().then(({records}) => records[records.length - 1].getCellValue('No')))
};

async function pageSpeedTest(testNo, delay = false) {
    const {pageSpeedAPIURL, delayAPIURL} = settings;

    if (typeof testNo !== 'number') return 0;
    if (delay) await fetch(delayAPIURL);

    return await fetch(pageSpeedAPIURL).then(response => response.json())
    .then(async function(json) {
        if (!json || !json.lighthouseResult || !json.lighthouseResult.audits) return 0;

        const {['largest-contentful-paint']: largestPaint} = json.lighthouseResult.audits;

        await table.createRecordsAsync([
            {
                fields: {
                    'Name': 'Overall',
                    'Score': json.lighthouseResult.categories.performance.score,
                    'No': testNo
                }
            },
            {
                fields: {
                    'Name': 'Largest Contentful Paint',
                    'Score': largestPaint.score,
                    'No': testNo
                }
            }
        ]);

        output.text(`test no. ${testNo} ${delay ? 'with' : 'without'} delay is done`);

        return testNo;
    });
}

let counter = settings.lastNo + 1;

for (let i = 0; i < settings.testAmount; i++) {
    const testNo = await pageSpeedTest(counter, !!i);

    if (testNo === counter) counter++;
}
