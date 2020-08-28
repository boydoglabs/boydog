const path = require("path")
const ShareDB = require("sharedb")
const WebSocket = require("ws")
const WebSocketJSONStream = require("@teamwork/websocket-json-stream")
const backend = new ShareDB()
const connection = backend.connect()

// Boydog back-end scope
let docScope = {}

const init = (scope, server) => {
  docScope = scope

  //Add "/boydog-client" as an express Express route
  server._events.request.get("/boydog-client", function (req, res) {
    return res.sendFile(
      path.join(__dirname, "boydog-client.bundle.js")
    )
  })

  // Connect any incoming WebSocket connection to ShareDB
  const wss = new WebSocket.Server({ server })
  wss.on("connection", (ws) => {
    backend.listen(new WebSocketJSONStream(ws))
  })

  const iterate = (root, path = "") => {
    // TODO: Add support for reading non-leaf elements, these should reply with JSON.stringify(path)
    Object.entries(root).forEach((e) => {
      if (Object.prototype.toString.call(e[1]) === "[object Object]") {
        iterate(e[1], `${path}>${e[0]}`)
      } else if (Object.prototype.toString.call(e[1]) === "[object Array]") {
        iterate({ ...e[1] }, `${path}>${e[0]}`)
      } else {
        const fullPath = `${path}>${e[0]}`.substr(1)
        docScope[fullPath] = ((selector) => {
          // Get document or create it if needed
          const doc = connection.get("boydog", selector)
          doc.fetch(function (err) {
            if (err) throw err
            if (doc.type === null) return doc.create({ content: String(e[1]) }) // If document doesn't exists then create it
          })
          return doc
        })(fullPath)
      }
    })
  }
  iterate(docScope)

  console.log("New boydog documents created:", Object.keys(docScope))
}

module.exports = { init }
