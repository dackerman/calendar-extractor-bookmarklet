var fs = require('fs');
const {exec} = require('child_process');

const command = 'java -jar closure-compiler-v20200406.jar --js index.js --compilation_level ADVANCED'

const version = `console.log('Calendar Extractor version: ${new Date().toISOString()}');`;

exec(command, (err, stdout, stderr) => {
    if (err) {
        console.error(err);
    } else {
        console.log('javascript:(function(){' + version + encodeURIComponent(stdout) + ';drawCalendarExtractorWindow();})();');
    }
});

