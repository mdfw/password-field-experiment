/*
 * Build Bloom filter : A bloom filter builder and serializer
 *
 * Copyright (c) 2017-2017 Mark Williams (http://mdfw.me)
 * Released under the MIT license.
 *
 * For more information, see readme.
 */

var bloomfile = process.argv[2];
var bloomseedfile = process.argv[3];
var wordsfile = process.argv[4];

if (!bloomfile || !bloomfile.trim() || !wordsfile || !wordsfile.trim() || !bloomseedfile || !bloomseedfile.trim()) {
    console.error('No bloomfile name or no wordsfile name or no bloomseedfile name passed in.');
    console.warn('Call me with bloomfilename bloomseedfile wordsfile - in that order. I\'m pretty stupid so don\'t get crazy.');
    console.error('Exiting.');
    process.exit(1);
}

var fs = require('fs');

// Make sure we can access the files.
try {
    fs.accessSync(bloomfile, fs.constants.R_OK | fs.constants.W_OK);
} catch(err) {
    console.error('Error: cannot read bloomfile. Check file name and permissions.');
    process.exit(1);
}
try {
    fs.accessSync(bloomseedfile, fs.constants.R_OK | fs.constants.W_OK);
} catch(err) {
    console.error('Error: cannot read bloomseedfile. Check file name and permissions.');
    process.exit(1);
}
try {
    fs.accessSync(wordsfile, fs.constants.R_OK | fs.constants.W_OK);
} catch(err) {
    console.error('Error: cannot read wordsfile. Check file name and permissions.');
    process.exit(1);
}

console.log('Processing wordsfile: ' + wordsfile + ' against serialized bloomfilter: ' + bloomfile + '.');


// Initialize bloom filter
var bf = require('./bloomfilter'),
    BloomFilter = bf.BloomFilter;

var bloomcontents = fs.readFileSync(bloomfile, 'utf8');
var bloomjson = JSON.parse(bloomcontents);

var bloom = new BloomFilter(
    bloomjson, // number of bits to allocate.
    16        // number of hash functions.
);

// Load bloom seed file
var bloomwords = [];
var bloomSeedLineReader = require('readline').createInterface({
    input: fs.createReadStream(bloomseedfile)
});

bloomSeedLineReader.on('line', function (line) {
    bloomwords.push(line);
});

bloomSeedLineReader.on('close', function () {
    console.log('Bloom filter seeds: ' + bloomwords.length);
    var falsepositives = 0;
    var testedwords = 0;

    var wordLineReader = require('readline').createInterface({
        input: fs.createReadStream(wordsfile)
    });

    wordLineReader.on('line', function (line) {  
        line = line.split(' ')[2];
        testedwords++;

        if (bloom.test(line)) {
            if (bloomwords.indexOf(line) == -1) {
                console.warn(line, ' is a false positive.');
                falsepositives++;
            }
        }
    });

    wordLineReader.on('close', function () {
        console.log('Total false positives: ' + falsepositives + ' out of ' + testedwords + ' tested words.');
        console.log('Finished.');
    });
});






