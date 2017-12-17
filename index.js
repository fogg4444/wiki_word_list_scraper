var cheerio = require('cheerio');
var request = require('request');
var fs = require('fs')

let resultsFileLocation = './results'
let resultsFileName = 'results.csv'

let baseUrl = 'https://en.wiktionary.org/wiki/Index'
let alphabet = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z']
let languageList = ['French', 'Italian', 'German']


let clearResultsFile = () => {
  languageList.forEach((languageFromList, i) => {
    let thisFile = resultsFileLocation + '/' + languageFromList + '_' + resultsFileName
    fs.writeFileSync(thisFile, '')
  })
}

let getBodyByUrl = (url) => {
  return new Promise((resolve, reject) => {
    request(url, (err, res, body) => {
      if(err) {
        reject(err)
      }
      resolve(body)
    })
  })
}


let processTitleSpan = (elem) => {
  return processTitleATag(elem.children[0])
  // TODO: remove (does not exist) from title
}

let processTitleATag = (elem) => {
  // console.log('Process tag');
  return elem.attribs.title
}

let processEachListElem = (listElem) => {
  console.log('-------------------------------------------------------------------');
  // console.log('listElem', listElem.children);

  // TODO: improve this whole function
  // Not really handling spans well here

  let firstChild = listElem.children[0]

  console.log(firstChild);
  
  let processedResult = {
    name: '',
    type: '- - -',
    symbol: '- - -'
  }

  if(firstChild.name === 'span') {
    //  handle partyly new
    processedResult.name = processTitleSpan(firstChild)
  } else {
    processedResult.name = processTitleATag(firstChild)
  }
  
  // if(firstChild.name === 'span') {
  // } else if(firstChild.name === 'a') {
  //   processedResult.name = processTitleSpan(listElem)
  // }

  if(processedResult.name === undefined) {
    console.log('0---', listElem);
  }

  console.log('-------------------------------------------------------------------');
  return processedResult
}

let writeLineToFile = (line, language) => {
  let formattedFileToWrite = resultsFileLocation + '/' + language + '_' + resultsFileName
  fs.appendFileSync(formattedFileToWrite, line)
}

let getFormattedWordsFromPage = (body, language) => {
  return new Promise((resolve, reject) => {
    let $ = cheerio.load(body);
    let allListElements = $('.index').children('ol').children('li')

    allListElements.each((i, eachElem) => {
      let eachProcessedListItem = processEachListElem(eachElem)
      // console.log('eachProcessedListItem', eachProcessedListItem);
      if(eachProcessedListItem) {
        let formattedLine = eachProcessedListItem.name + ',' + eachProcessedListItem.type + ',' + eachProcessedListItem.symbol + '\n'
        writeLineToFile(formattedLine, language)
      }
    })
    resolve()
  })
}


let writeForEachLetter = (letter, language) => {
  return new Promise((resolve, reject) => {
    console.log('Parsing ' + language + ' ' + letter);
    let url = baseUrl + ':' + language + '/' + letter
    console.log(' url', url);
    getBodyByUrl(url)
    .then((body) => {
      return getFormattedWordsFromPage(body, language)
    })
    .then(() => {
      resolve()
    })
  })
}


const promiseSerial = funcs =>
  funcs.reduce((promise, func) =>
    promise.then(result => func().then(Array.prototype.concat.bind(result))),
    Promise.resolve([]))



let getAllWordsForLanguage = (language) => {
  let promiseList = []

  alphabet.forEach((elem, i) => {
    promiseList.push(() => {
      return writeForEachLetter(elem, language)
    })
  })
  
  promiseSerial(promiseList)
    .then(() => { console.log('then') })
    .catch((err) => { console.log('err') })
}



clearResultsFile()
getAllWordsForLanguage('French')
// getAllWordsForLanguage('German')