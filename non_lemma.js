console.log('GET NON LEMMA RESULTS');

var cheerio = require('cheerio');
var request = require('request');
var fs = require('fs')

let domain = 'https://en.wiktionary.org'
let baseUrl = domain + '/w/index.php?title=Category:French_non-lemma_forms'


let languageList = ['French', 'Italian', 'German']
let resultsFileLocation = './non_lemma_results'
let resultsFileName = 'non_lemma_results.csv'

let getBaseUrlByLang = (lang) => {
  return 'https://en.wiktionary.org/w/index.php?title=Category:' + lang + '_non-lemma_forms'
}

let clearResultsFile = () => {
  languageList.forEach((languageFromList, i) => {
    let thisFile = resultsFileLocation + '/' + languageFromList + '_' + resultsFileName
    fs.writeFileSync(thisFile, '')
  })
}

clearResultsFile()


let getBodyByUrl = (url, callback) => {
  request(url, (err, res, body) => {
    if(err) {
      callback(null)
    }
    callback(body)
  })
}

let checkIfLinkIsValidNext = (link) => {
  // console.log('Link to check', link);
  let result = false
  if('children' in link) {

    // console.log('FOund children', link.children[0].data);
    let firstChildData = link.children[0].data
    if(firstChildData === 'previous page') {
      result = false
    } else if(firstChildData === 'next page') {
      result = true
    }
  }

  // && selectedLink.children[0].data === 'next page'

  return result
}


let getListElemsAndNextLink = (body, language, callback) => {
    let $ = cheerio.load(body);
    let nextLinkContainer = $('#mw-pages').children()

    let selectedLink = nextLinkContainer[nextLinkContainer.length - 1]

    let lastChildLink = ''
    if(checkIfLinkIsValidNext(selectedLink)) {
      // selectedLink.children[0].data === 'next page'
      lastChildLink = selectedLink.attribs.href
      // console.log('Selected link', lastChildLink);
    }

    // console.log('==== lastChildLink', lastChildLink);

    let formattedNextLink = null

    if(lastChildLink.length > 0) {
        formattedNextLink = domain + lastChildLink
    }

    let results = {
      nextLink: formattedNextLink,
      allListElems: $('.mw-category-group').find('li')
    }
    callback(results)
}


let writeListElemsToFile = (listElems, lang) => {
  // console.log('listElem', listElems.length, typeof listElems);
  listElems.each((i, elem) => {
    let formattedFileToWrite = resultsFileLocation + '/' + lang + '_' + resultsFileName
    let data = elem.children[0].children[0].data
    // console.log(data);
    if(data !== undefined) {
      let line = data + '\n'
      fs.appendFileSync(formattedFileToWrite, line)
    }
  })
}

let getAllElementsFromAllPages = (url, language) => {

    let recursiveGetPage = (url) => {
      getBodyByUrl(url, (body) => {
        getListElemsAndNextLink(body, language, (res) => {
          writeListElemsToFile(res.allListElems, language)
          console.log('Has finished writing page', res.nextLink);
          if(res.nextLink) {
            recursiveGetPage(res.nextLink)
          } else {
            return null
          }
        })
      })
    }
    recursiveGetPage(url)
}


let testUrl = 'https://en.wiktionary.org/w/index.php?title=Category:Italian_non-lemma_forms&pagefrom=ZUMERANNO%0Azumeranno#mw-pages'

// getAllElementsFromAllPages(testUrl, 'Italian')


languageList.forEach((lang, i) => {
  let startUrl = getBaseUrlByLang(lang)
  getAllElementsFromAllPages(startUrl, lang)
})
