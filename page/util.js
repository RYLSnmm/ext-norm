const fs = require("fs")
const path = require("path")

const loadFiles = (base, recursive) => {
    const basestat = fs.statSync(base)
    if (basestat.isFile()) {
        return [{ name: path.basename(base), path: path.resolve(base) }]
    }

    const result = []

    const recurse = (dir) => {
        const dirents = fs.readdirSync(dir, { withFileTypes: true })
        for (const ent of dirents) {
            const entpath = path.join(dir, ent.name)
            if (ent.isFile()) {
                result.push({ name: ent.name, path: entpath })
            }
            if (ent.isDirectory() && recursive) {
                recurse(entpath)
            }
        }
    }

    if (basestat.isDirectory()) {
        recurse(path.resolve(base))
    }
    return result
}

const extnorm = (filename, toupper) => {
    const parts = filename.split(".")
    if (parts.length === 1) return filename
    if (parts.length === 2 && parts[0] === "") return filename
    const ext = parts.pop()
    if (!/^[a-zA-Z0-9]+$/.test(ext)) return filename
    parts.push(toupper ? ext.toUpperCase() : ext.toLowerCase())
    return parts.join(".")
}

module.exports = { loadFiles, extnorm }
