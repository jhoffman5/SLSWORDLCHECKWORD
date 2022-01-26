"use strict";
var fs = require('fs');
var readline = require('readline');

const { GetObjectCommand, S3Client } = require('@aws-sdk/client-s3')
const client = new S3Client() // Pass in opts to S3 if necessary

const aws = require('aws-sdk');
const { exit } = require('process');
const s3 = new aws.S3(); // Pass in opts to S3 if necessary

var getWordParams = {
    Bucket: 'w3.hoffmanjoshua.net', // your bucket name,
    Key: 'wordl/wordoftheday.txt' // path to the object you're looking for
}

var getDictParams = {
  Bucket: 'w3.hoffmanjoshua.net', // your bucket name,
  Key: 'wordl/dictionaryTree.json' // path to the object you're looking for
}


module.exports.checkword = async (event) => {
  var guessWord = event.pathParameters.word;
  var wordlWord = await getObject(getWordParams.Bucket, getWordParams.Key);

  var isValidWord = (wordlWord.length == guessWord.length) ? await checkIsValidWord(guessWord) : false;

  if(isValidWord) {
    var scoringMatrix = scoreWord(wordlWord, guessWord);
    return {
      statusCode: 200,
      body: JSON.stringify(
        {
          message: "Valid Word: " + guessWord,
          input: event,
          scoring: scoringMatrix
        },
        null,
        2
      ),
    };
  }

  return {
    statusCode: 404,
    body: JSON.stringify(
      {
        message: "Invalid Word: " + guessWord,
        input: event,
      },
      null,
      2
    ),
  };

};

function getObject (Bucket, Key) {
  return new Promise(async (resolve, reject) => {
    const getObjectCommand = new GetObjectCommand({ Bucket, Key })

    try {
      const response = await client.send(getObjectCommand)
  
      // Store all of data chunks returned from the response data stream 
      // into an array then use Array#join() to use the returned contents as a String
      let responseDataChunks = []

      // Handle an error while streaming the response body
      response.Body.once('error', err => reject(err))
  
      // Attach a 'data' listener to add the chunks of data to our array
      // Each chunk is a Buffer instance
      response.Body.on('data', chunk => responseDataChunks.push(chunk))
  
      // Once the stream has no more data, join the chunks into a string and return the string
      response.Body.once('end', () => resolve(responseDataChunks.join('')))
    } catch (err) {
      // Handle the error or throw
      return reject(err)
    } 
  })
}

function scoreWord (wordlWord, word) {
  var returnMapping = new Array(word.length).fill(0);
  for(var letter in word)
  {
    if(wordlWord[letter] == word[letter]) // exact match
    {
      returnMapping[letter] = 2; // 2 = correct letter in position
    } else if (wordlWord.indexOf(word[letter]) > -1) // in the word but not the exact position
    {
      returnMapping[letter] = 1; // 1 = in
    }
  }
  return returnMapping;
}

async function checkIsValidWord(word) {
  console.log("same length")
  const wordlDict = JSON.parse(await getObject(getDictParams.Bucket, getDictParams.Key));

  var possibleLetters = wordlDict;

  for(var i = 0; i < word.length; i++) {
    if(typeof possibleLetters[word[i]] == 'undefined')
    {
      return false;
    }
    possibleLetters = possibleLetters[word[i]];
  }
  return true;

}