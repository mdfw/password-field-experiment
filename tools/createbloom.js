/*
 * Build Bloom filter : A bloom filter builder and serializer
 *
 * Copyright (c) 2017-2017 Mark Williams (http://mdfw.me)
 * Released under the MIT license.
 *
 * For more information, see readme.
 */

var filename = process.argv[2];
var bitsin = process.argv[3];
var hashfuncsin = process.argv[4]
var minlengtharg = process.argv[5];


if (!filename || !filename.trim()) {
    console.error('No filename passed in.');
    console.warn('Call me with filename bits1 bits2 - in that order. I\'m pretty stupid so don\'t get crazy.');
    console.error('Exiting.');
    process.exit(1);
}

var fs = require('fs');

// Make sure we can access the file.
try {
    fs.accessSync(filename, fs.constants.R_OK | fs.constants.W_OK);
    console.log('Processing: ' + filename);
} catch(err) {
    console.error('Error: cannot read file. Check file name and permissions.');
    process.exit(1);
}

// Build a bloom filter.
var bf = require('./bloomfilter'),
    BloomFilter = bf.BloomFilter;

// If we pass in bits and hash functions, use them. 
// Note: Doesn't check for valid bit values.
var bits = 8192;
if (bitsin) {
    bitsin = parseInt(bitsin.trim());
    if (bitsin && bitsin > 0) {
        bits = bitsin;
    }
}

var hashfuncs = 16;
if (hashfuncsin) {
    hashfuncsin = parseInt(hashfuncsin.trim());
    if (hashfuncsin && hashfuncsin > 0) {
        hashfuncs = hashfuncsin;
    }
}

var bloom = new BloomFilter(
  bits,     // number of bits to allocate.
  hashfuncs // number of hash functions.
);

// Define minimum length for items added to filter.
var minlength = 0;
if (minlengtharg) {
    minlengtharg = parseInt(minlengtharg.trim());
    if (minlengtharg && minlengtharg > 0) {
        minlength = minlengtharg;
    }
}

console.log('Bloom filter: created with m (num of bits) of ' + bits + '  and k (hash functions) of ' + hashfuncs + '.');
console.log('              Filtering words with less than ' + minlength + ' characters.');

var linenum = 1; // For reporting number of lines.
var ignoredLines = 0; // For reporting.

// Add lines to the bloom filter.
var lineReader = require('readline').createInterface({
    input: fs.createReadStream(filename)
});
lineReader.on('line', function (line) {
    if (line.length > minlength) {
        bloom.add(line);
        linenum++;
    } else {
        // console.log('Not indexing: ' + line);
        ignoredLines++;
    }
});

// When we are done building the bloom filter, verify and serialize it.
lineReader.on('close', function () {
    console.log('Bloom filter: Added ' + linenum + ' lines. Ignored ' + ignoredLines + ' lines.');

    var validateLineReader = require('readline').createInterface({
        input: fs.createReadStream(filename)
    });
    var bloomValid = true;
    validateLineReader.on('line', function (line) {  
        if (line.length > minlength && !bloom.test(line)) {
            console.warn('WARN: ' + line + ' does not appear to pass - it may mean the bloom filter is corrupt.');
            bloomValid = false;
        }
    });

    console.log(bloomValid ? 'Bloom filter: Passed tests.' : 'Bloom filter: did not pass tests.');

    validateLineReader.on('close', function() {

        // Create write file name for serializing bloom filter.
        var writefilename = filename;
        if (writefilename.endsWith('.txt')) {
            writefilename = writefilename.substring(0, writefilename.length - 4);
        }
        writefilename = writefilename + '_bloom_' + bits + 'bits' + hashfuncs + 'hashes.json';

        // Serialisation. Note that bloom.buckets may be a typed array,
        // so we convert to a normal array first.
        var array = [].slice.call(bloom.buckets),
            json = JSON.stringify(array);

        fs.writeFile(writefilename, json, (err) => {
            if (err) throw err;
        });
        console.log('Bloom filter: Serialized to ' + writefilename);
        console.log('Finished');
    });
});



