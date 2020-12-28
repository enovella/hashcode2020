const fs = require('fs')
const inputPath = process.argv[2]
const outputPath = process.argv[3]
console.log('Reading input ' + inputPath)
const content= fs.readFileSync(inputPath)
const rows = content.toString().split('\n')
const readRow = (rows, index) => rows[index].split(' ').map(v => parseInt(v))

const [BOOKS, LIBRARIES, DAYS] = readRow(rows, 0)
console.log({ BOOKS, LIBRARIES, DAYS })

const scores = readRow(rows, 1)
console.log({
  minScore: Math.min(...scores),
  avgScore: scores.reduce((acc, s) => acc += s, 0) / scores.length,
  maxScore: Math.max(...scores)
})

const libraries = []
for (let l=0; l<LIBRARIES; l++) {
  const [totalBooks, signUp, scansPerDay] = readRow(rows, 2 * l + 2 )
  const bookIds  = readRow(rows, 2 * l + 3 )
  libraries.push({
    id: l,
    totalBooks,
    signUp,
    scansPerDay,
    bookIds
  })
}

libraries.sort((a, b) => a.signUp - b.signUp)
const assignedBooks = {}
const scannings = []
libraries.forEach((library) => {
  const filtered = library.bookIds.filter((bookId) => !assignedBooks[bookId])
  scannings.push({
    libraryId: library.id,
    bookIds: filtered
  })
  filtered.forEach((bookId) => assignedBooks[bookId] = true)
})

let output = ''
output += `${scannings.length}\n`
scannings.forEach((s) => {
  output += `${s.libraryId} ${s.bookIds.length}\n`
  output += `${s.bookIds.join(' ')}\n`
})

console.log('Computing score...')
const scoreScannings = [...scannings]
const onBoard = []
const scannedBooks = {}
let signUpFinishes = 0
let inSignUp = null
let totalScore = 0
for (let d=0; d< DAYS; d++) {
  if (scoreScannings.length && signUpFinishes <= d) {
    const { libraryId, bookIds } = scoreScannings.shift()

    const library = libraries.find(l => l.id === libraryId)
    signUpFinishes = d + library.signUp
    inSignUp = { library, bookIds }
    onBoard.push({ library, signUpFinishes, bookIds })
  }

  const readyToScan = onBoard.filter(({ signUpFinishes }) => signUpFinishes <= d)

  readyToScan.forEach(({ library, bookIds }) => {
    const { scansPerDay } = library
    let scans = scansPerDay
    while (scans > 0 && bookIds.length) {
      const bookId = bookIds.shift()
      scans -= 1
      if (scannedBooks[bookId]) continue

      scannedBooks[bookId] = true
      totalScore += scores[bookId]
    }
  })
}

console.log({ totalScore })
