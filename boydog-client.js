const sharedb = require("sharedb/lib/client")
const ReconnectingWebSocket = require("reconnecting-websocket")
const Binding = require("sharedb-attribute-binding")
const $ = require("cash-dom")
const Swal = require("sweetalert2")
const _toPath = require("lodash.topath")
const bdAttributes = ["bd-value", "bd-id", "bd-class", "bd-html", "bd-click"]

// Boydog front-end scope
let valScope = {} // Always the latest value of the path
let domScope = {} // All dom elements bound to a path
let eventScope = {} // Post OP event of a path

const init = (root = "html", host = window.location.host) => {
  // Open WebSocket connection to ShareDB server
  const socket = new ReconnectingWebSocket("ws://" + host)
  const connection = new sharedb.Connection(socket)

  // Status messages // TODO: Move to a small status icon at the bottom-right part of the screen?
  socket.addEventListener("open", function () {
    Swal.fire({
      text: "⠀Boydog connected",
      icon: "info",
      toast: true,
      timer: 5000,
      showConfirmButton: false,
      position: "bottom-end",
    })
  })

  socket.addEventListener("close", function () {
    Swal.fire({
      text: "⠀Boydog disconnected",
      icon: "warning",
      toast: true,
      showConfirmButton: false,
      position: "bottom-end",
    })
  })

  const updateLatestVal = (doc, path) => {
    doc.fetch((err) => {
      if (err) throw err
      valScope[path] = doc.data.content
    })
  }

  // Search and bind attributes
  bdAttributes.forEach((attr) => {
    const els = $(`[${attr}]`)

    els.each((i, dom) => {
      if (dom.getAttribute("bd-bind")) return // Return if already bound

      // Normalize attr and update document
      dom.setAttribute(attr, _toPath(dom.getAttribute(attr)).join(">"))
      const path = dom.getAttribute(attr)

      if (!Array.isArray(domScope[path])) domScope[path] = []
      if (attr !== "bd-value") domScope[path].push(dom)

      // Create ShareDB document
      const doc = connection.get("boydog", path)
      if (!eventScope[path]) {
        eventScope[path] = () => {} // Can be overriden to execute an event post OP
        doc.subscribe((err) => {
          if (err) throw err

          doc.on("op", (op) => {
            if (dom.getAttribute("bd-verbose")) console.log("Boydog operation on:", path, op)
            updateLatestVal(doc, path)
            eventScope[path]() // Call post OP event, if any
          })
          updateLatestVal(doc, path)
        })
      }

      doc.fetch((err) => {
        if (err) throw err

        try {
          new Binding(dom, doc, ["content"], attr.slice(attr.indexOf("-") + 1)).setup()
          dom.setAttribute("bd-bind", true)
        } catch (err) {
          if (err.message === "Cannot read property 'content' of undefined") {
            console.log(`Warning: Unrecognized '${path}' path. Either a typo or path is not a leaf.`)
          }
        }
      })
    })
  })

  console.log("Boydog client connected.")
}

console.log("Boydog client found. Now run `boydog.init(scope, host)` to begin sharing in real-time.")

window.boydog = { init }
