/*
 * Number line counter : A simple line counter that limits by minimum length.
 *
 * Copyright (c) 2017-2017 Mark Williams (http://mdfw.me)
 * Released under the MIT license.
 *
 * For more information, see readme.
 */

var filename = process.argv[2];
var minlengtharg = process.argv[3];

if (!filename || !filename.trim()) {
    console.error('No filename passed in.');
    console.warn('Call me with filename bits1 bits2 - in that order. I\'m pretty stupid so don\'t get crazy.');
    console.error('Exiting.');
    process.exit(1);
}

var fs = require('fs');
var linenum = 1; // For reporting number of lines.
var ignoredLines = 0; // For reporting.

// Make sure we can access the files.
try {
    fs.accessSync(filename, fs.constants.R_OK | fs.constants.W_OK);
} catch(err) {
    console.error('Error: cannot read file. Check file name and permissions.');
    process.exit(1);
}

// Define minimum length for items added to filter.
var minlength = 0;
if (minlengtharg) {
    minlengtharg = parseInt(minlengtharg.trim());
    if (minlengtharg && minlengtharg > 0) {
        minlength = minlengtharg;
    }
}

var lineReader = require('readline').createInterface({
    input: fs.createReadStream(filename)
});
lineReader.on('line', function (line) {
    if (line.length > minlength) {
        linenum++;
    } else {
        ignoredLines++;
    }
});

lineReader.on('close', function () {
    console.log('Filename: ' + filename + ' valid lines: ' + linenum + '. Ignored lines:' + ignoredLines + '.');
});