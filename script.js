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
  const maxScore = bookIds
    .map((id) => scores[id])
    .reduce((acc, v) => acc += v, 0)
  libraries.push({
    id: l,
    totalBooks,
    signUp,
    scansPerDay,
    bookIds: bookIds.sort((a, b) => scores[b] - scores[a])
  })
}

const minScansPerDay = Math.min(...libraries.map((l) => l.scansPerDay))
const maxScansPerDay= Math.max(...libraries.map((l) => l.scansPerDay))
const minSignUp = Math.min(...libraries.map((l) => l.signUp))
const maxSignUp =  Math.max(...libraries.map((l) => l.signUp))
const minTotalBooks = Math.min(...libraries.map((l) => l.totalBooks))
const maxTotalBooks =  Math.max(...libraries.map((l) => l.totalBooks))
const avgScansPerDay = libraries.reduce((acc, l) => acc += l.scansPerDay, 0) / libraries.length
const avgSignUp = libraries.reduce((acc, l) => acc += l.signUp, 0) / libraries.length
const avgTotalBooks = libraries.reduce((acc, l) => acc += l.totalBooks, 0) / libraries.length
console.log({ minScansPerDay, avgScansPerDay, maxScansPerDay})
console.log({ minTotalBooks,avgTotalBooks, maxTotalBooks})
const countNew = (library, assignedBooks) => {
  library.bookIds.filter((bookId) => !assignedBooks[bookId]).length
}

const scoreLibrary = (library, assignedBooks, day) => {
  const effectiveDays = DAYS - day - library.signUp
  const effectiveBooks = effectiveDays * library.scansPerDay
  const filtered = library.bookIds.filter((b) => !assignedBooks[b]).slice(0, effectiveBooks)
  return filtered.reduce((acc, bookId) => acc += scores[bookId], 0) / library.signUp
}

libraries.sort((a, b) => a.signUp - b.signUp || b.scansPerDay - a.scansPerDay || b.totalBooks - a.totalBooks)
const assignedBooks = {}
const scannings = []
let nextSignup = 0
const candidates = [...libraries]
const total = candidates.length
while (scannings.length < total) {
  const samples = candidates.slice(0, 200)
  const library = samples
    .sort((a,b) => scoreLibrary(b, assignedBooks, nextSignup) - scoreLibrary(a, assignedBooks, nextSignup))
    [0]

  const filtered = library.bookIds.filter((bookId) => !assignedBooks[bookId])
  scannings.push({
    libraryId: library.id,
    bookIds: filtered
  })
  filtered.forEach((bookId) => assignedBooks[bookId] = true)
  candidates.splice(candidates.indexOf(library), 1)
}

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
