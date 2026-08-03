// Estrae il contenuto self-contained dal build single-file (dist-artifact)
// e produce dist-artifact/atlas-app.html, pronto per la pubblicazione come
// Artifact (senza i tag wrapper <html>/<head>/<body>, forniti dall'host).
import fs from 'fs'
import path from 'path'

const dir = 'dist-artifact'
const src = path.join(dir, 'index.artifact.html')
const out = path.join(dir, 'atlas-app.html')

const doc = fs.readFileSync(src, 'utf8')
const headStart = doc.indexOf('<head>') + '<head>'.length
const bodyOpen = doc.lastIndexOf('<body>')
const headEnd = doc.lastIndexOf('</head>', bodyOpen)
const bodyEnd = doc.lastIndexOf('</body>')

const head = doc
  .slice(headStart, headEnd)
  .replace(/<meta[^>]*>/gi, '')
  .replace(/<title>[\s\S]*?<\/title>/i, '')
  .trim()
const body = doc.slice(bodyOpen + '<body>'.length, bodyEnd).trim()

fs.writeFileSync(out, head + '\n' + body + '\n')
console.log(`Artifact scritto: ${out} (${fs.statSync(out).size} byte)`)
