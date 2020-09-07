const sharedb = require("sharedb/lib/client")
const ReconnectingWebSocket = require("reconnecting-websocket")
const Binding = require("sharedb-attribute-binding")
const $ = require("cash-dom")
const Swal = require("sweetalert2")
const _toPath = require("lodash.topath")
const bdAttributes = ["bd-id", "bd-class", "bd-value", "bd-html", "bd-click"]

// Open WebSocket connection to ShareDB server
const socket = new ReconnectingWebSocket("ws://" + window.location.host)
const connection = new sharedb.Connection(socket)

// Status messages // TODO: Move to a small status icon at the bottom-right part of the screen?
socket.addEventListener("open", function () {
  Swal.fire({
    text: "⠀Boydog found",
    icon: "info",
    toast: true,
    timer: 3000,
    showConfirmButton: false,
    position: "bottom-end",
  })
})

socket.addEventListener("close", function () {
  Swal.fire({
    text: "⠀Boydog disconnected",
    icon: "warning",
    toast: true,
    timer: 3000,
    showConfirmButton: false,
    position: "bottom-end",
  })
})

socket.addEventListener("error", function () {
  Swal.fire({
    text: "⠀Boydog disconnected",
    icon: "error",
    toast: true,
    timer: 3000,
    showConfirmButton: false,
    position: "bottom-end",
  })
})

// Boydog front-end scope
let domScope = []

const init = (root = "html") => {
  bdAttributes.forEach((attr) => {
    const els = $(`[${attr}]`)
    if (els.length === 0) return
    els.each((i, dom) => {
      // Normalize attr and update document
      dom.setAttribute(attr, _toPath(dom.getAttribute(attr)).join(">"))
      const path = dom.getAttribute(attr)

      // Create shareDB document
      const doc = connection.get("boydog", path)
      doc.subscribe((err) => {
        if (err) throw err

        doc.on("op", (op) => {
          console.log("Boydog operation on:", path, op)
        })

        try {
          new Binding(dom, doc, ["content"], attr.slice(attr.indexOf("-") + 1)).setup()
        } catch (err) {
          if (err.message === "Cannot read property 'content' of undefined") {
            console.log(
              `Warning: Unrecognized '${path}' path. Either a typo or path is not a leaf.`
              // TODO: Show element in red
            )
          }
        }
      })

      domScope.push({ dom, attr, path, doc })
    })
  })
}

init()

window.boydog = { init }
