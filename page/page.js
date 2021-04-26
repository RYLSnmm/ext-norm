const { html, render } = require("./lit-html.js")
const { loadFiles, extnorm } = require("./util.js")
const fs = require("fs")
const path = require("path")

const root = document.getElementById("root")

const state = {
    items: []
}

const status = (item) => {
    if (item.filepath === item.normfilepath) {
        return html`<span class="noconv">変換不要</span>`
    }
    if (item.done) {
        return html`<span class="doneconv">変換済み</span>`
    }
}

const onchangeCheck = (name, obj) => event => {
    (obj || state)[name] = event.target.checked
    update()
}

const onchangeAllCheck = event => {
    state.items.forEach(row => row.checked = event.target.checked)
    update()
}

const template = () => html`
    <header>
        <label>
            <input type="checkbox" .checked=${state.subfolder}
                @change=${onchangeCheck("subfolder")}/>
            <span>サブフォルダも読み込み</span>
        </label>
        <label>
            <input type="checkbox" .checked=${state.showfullpath}
                @change=${onchangeCheck("showfullpath")}/>
            <span>フルパス表示</span>
        </label>
        <label>
            <input type="checkbox" .checked=${state.uppercase}
                @change=${onchangeCheck("uppercase")}/>
            <span>大文字に揃える</span>
        </label>
    </header>
    <main>
        <table>
            <thead>
                <tr>
                    <th>
                        <input type="checkbox" .checked=${state.items.every(x => x.checked)}
                            @change=${onchangeAllCheck}/>
                    </th>
                    <th>現在のファイル名</th>
                    <th>変更後のファイル名</th>
                    <th>ステータス</th>
                </tr>
            </thead>
            <tbody>
                ${
                    state.items.map(row => {
                        return html`
                            <tr>
                                <td>
                                    <input type="checkbox" .checked=${row.checked}
                                        @change=${onchangeCheck("checked", row)}/>
                                </td>
                                <td>
                                    ${state.showfullpath ? row.filepath : row.filename}
                                </td>
                                <td>
                                    ${state.showfullpath ? row.normfilepath : row.normfilename}
                                </td>
                                <td>${status(row)}</td>
                            </tr>
                        `
                    })
                }
            </tbody>
        </table>
    </main>
    <footer>
        <button @click=${() => run()}>変換</button>
        <button @click=${() => clear()}>クリア</button>
    </footer>
`

const update = () => {
    render(template(), root)
}

const run = () => {
    try {
        for (const item of state.items) {
            if (item.checked && item.filepath !== item.normfilepath) {
                const tmpkey = "_extnorm_" + Math.random().toString(16).slice(2) + "_"
                const tmpfilepath = path.join(item.dir, tmpkey + item.filename)
                fs.renameSync(item.filepath, tmpfilepath)
                fs.renameSync(tmpfilepath, item.normfilepath)
                item.done = true
            }
        }
    } catch (err) {
        console.error(err)
        alert("エラーが発生しました\n" + err.message)
    }

    update()
}

const clear = () => {
    state.items = []
    update()
}

document.addEventListener("drop", (event) => {
    event.preventDefault()
    event.stopPropagation()

    const new_items = [...event.dataTransfer.files]
        .flatMap(f => loadFiles(f.path, state.subfolder))
        .filter(({ path }) => state.items.every(r => r.filepath !== path))
        .map(file => {
            return {
                filename: file.name,
                filepath: file.path,
                dir: path.dirname(file.path),
                get normfilename() {
                    return extnorm(this.filename, state.uppercase)
                },
                get normfilepath() {
                    return path.join(this.dir, this.normfilename)
                },
                checked: true,
                done: false,
            }
        })
    state.items = [...state.items, ...new_items]
    update()
})

document.addEventListener("dragover", (event) => {
    event.preventDefault()
    event.stopPropagation()
})

update()
