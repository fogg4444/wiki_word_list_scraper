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

let processEachListElem = (listElem) => {
  // console.log('listElem', listElem.children);

  // TODO: improve this whole function
  // Not really handling spans well here

  let firstChild = listElem.children[0]


  // check that it is indeed a tag
  if(firstChild.type !== 'tag') {
    return null
  }


  let title = firstChild.attribs.title

  if(title === undefined) {
    return null
  }

  // console.log('firstChild', title);

  // let listElemChildren = listElem.children()

  //
  // listElemChildren.each((i, elem) => {
  //   console.log('Each child elem', elem);
  // })

  return {
    name: title || '---',
    type: '---',
    symbol: '---'
  }
}

let writeLineToFile = (line, language) => {
  let formattedFileToWrite = resultsFileLocation + '/' + language + '_' + resultsFileName
  
  console.log('-------', formattedFileToWrite);
  fs.appendFileSync(formattedFileToWrite, line)
}

let getFormattedWordsFromPage = (body, language) => {
  return new Promise((resolve, reject) => {
    let $ = cheerio.load(body);
    let allListElements = $('.index').children('ol').children('li')

    allListElements.each((i, eachElem) => {
      let eachProcessedListItem = processEachListElem(eachElem)
      console.log('eachProcessedListItem', eachProcessedListItem);
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
    console.log('Parsing ', letter);
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