var cheerio = require('cheerio');
var request = require('request');
var fs = require('fs')

let resultsFileLocation = './results/results.csv'

let baseUrl = 'https://en.wiktionary.org/wiki/Index:French/'
let alphabet = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z']

let clearResultsFile = () => {
  fs.writeFileSync(resultsFileLocation, '')
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

let writeLineToFile = (line) => {
  fs.appendFileSync(resultsFileLocation, line)
}

let getFormattedWordsFromPage = (body) => {
  return new Promise((resolve, reject) => {
    let $ = cheerio.load(body);
    let allListElements = $('.index').children('ol').children('li')

    allListElements.each((i, eachElem) => {
      let eachProcessedListItem = processEachListElem(eachElem)
      // console.log('eachProcessedListItem', eachProcessedListItem);
      if(eachProcessedListItem) {
        let formattedLine = eachProcessedListItem.name + ',' + eachProcessedListItem.type + ',' + eachProcessedListItem.symbol + '\n'
        writeLineToFile(formattedLine)
      }
    })
    resolve()
  })
}


let writeForEachLetter = (letter) => {
  return new Promise((resolve, reject) => {
    console.log('Parsing ', letter);
    let url = baseUrl + letter
    getBodyByUrl(url)
    .then((body) => {
      return getFormattedWordsFromPage(body)
    })
    .then(() => {
      resolve()
    })
  })
}

let promiseList = []

clearResultsFile()
alphabet.forEach((elem, i) => {
  promiseList.push(() => {
    return writeForEachLetter(elem)
  })
})


const promiseSerial = funcs =>
  funcs.reduce((promise, func) =>
    promise.then(result => func().then(Array.prototype.concat.bind(result))),
    Promise.resolve([]))


promiseSerial(promiseList)
  .then(() => { console.log('then') })
  .catch((err) => { console.log('err') })
