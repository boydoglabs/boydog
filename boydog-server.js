const path = require("path")
const ShareDB = require("sharedb")
const WebSocket = require("ws")
const WebSocketJSONStream = require("@teamwork/websocket-json-stream")
const backend = new ShareDB()
const connection = backend.connect()

// Boydog back-end scope
let docScope = {}

const init = (scope, server) => {
  //Add "/boydog-client" as an express Express route
  server._events.request.get("/boydog-client", function (req, res) {
    return res.sendFile(path.join(__dirname, "boydog-client.bundle.js"))
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
        // This is a leaf and needs a shareDB document
        const fullPath = `${path}>${e[0]}`.substr(1)
        docScope[fullPath] = ((selector) => {
          // Get document or create it if needed
          const doc = connection.get("boydog", selector)
          doc.fetch(function (err) {
            if (err) throw err
            if (doc.type === null) {
              docScope[fullPath]._latestValue = String(e[1])
              return doc.create({ content: String(e[1]) }) // If document doesn't exists then create it
            }
          })
          return doc
        })(fullPath)

        // Subscribe after an OP so that we know the latest value
        docScope[fullPath].subscribe((err) => {
          if (err) throw err
          docScope[fullPath].on("op", (op, source) => {
            docScope[fullPath].fetch((err) => {
              if (err) throw err
              docScope[fullPath]._latestValue = docScope[fullPath].data.content // The latest value is saved inside docScope too
            })
          })
        })

        // Define getter so that the latest value can be obtained from the server
        Object.defineProperty(root, e[0], {
          // TODO: Define set function, currently the user is not able to set a new scope value from the server
          set: (v) => {
            v = String(v)
            if (v === docScope[fullPath]._latestValue) return

            // TODO: Submit only needed changes. This code works but briefly erases the content from all clients and submits the new content. This sometimes causes the user's caret going to the beginning of the input.
            docScope[fullPath].submitOp(
              [{ p: ["content", 0], sd: docScope[fullPath]._latestValue }], // Delete old content on its entirety
              (err) => {
                if (err) throw err
                docScope[fullPath].submitOp(
                  [{ p: ["content", 0], si: v }], // Add new value
                  (err) => {
                    if (err) throw err
                  }
                )
              }
            )
          },
          get: () => {
            return docScope[fullPath]._latestValue
          },
        })
      }
    })
  }
  iterate(scope)

  console.log("New boydog documents created:", Object.keys(docScope))
}

module.exports = { init }
