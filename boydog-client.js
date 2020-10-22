const sharedb = require("sharedb/lib/client")
const ReconnectingWebSocket = require("reconnecting-websocket")
const Binding = require("sharedb-string-binding")
const $ = require("cash-dom")
const Swal = require("sweetalert2")
const _toPath = require("lodash.topath")
const acorn = require("acorn")
const acornWalk = require("acorn-walk")
const astring = require("astring")
const attrModel = "bd-value"
const attrCalculables = ["bd-id", "bd-class", "bd-html"]

// Boydog front-end scope
let valScope = {} // Always the latest value of the path
let calcScope = {} // Post OP event of a path

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

  const updateRelatedCalculables = (path) => {
    const c = calcScope[path]
    if (!c) return
    c.forEach((e) => (e.el[e.prop] = e.fn(valScope))) // Perform calculable final string
  }

  const updateLatestVal = (doc, path) => {
    doc.fetch((err) => {
      if (err) throw err
      if (doc && doc.data) valScope[path] = doc.data.content
      updateRelatedCalculables(path)
    })
  }

  const subscribeDoc = (doc, path, el) => {
    if (valScope[path] === undefined) {
      // Reliable `doc.subscribed` alternative
      valScope[path] = null // Null is a valid path t has not been assigned a value yet

      doc.subscribe((err) => {
        if (err) throw err

        updateLatestVal(doc, path, () => {})

        doc.on("op", (op) => {
          updateLatestVal(doc, path)
          if (el.getAttribute("bd-verbose")) console.log("Boydog operation on:", path, op)
        })
      })
    }
  }

  const processModel = (path, el) => {
    path = _toPath(path).join(">")

    const doc = connection.get("boydog", path)
    subscribeDoc(doc, path, el)

    doc.fetch((err) => {
      if (err) throw err
      try {
        new Binding(el, doc, ["content"]).setup()
      } catch (err) {
        console.log(`Warning: Unrecognized '${path}' path. Either a typo or path is not a leaf.`)
      }
    })
  }

  const processCalculable = (path, attr, attrVal, el) => {
    path = _toPath(path).join(">")

    const fn = new Function("sandbox", `with (sandbox) {const r = ${attrVal}; return r;}`)
    const eqs = {
      "bd-html": "innerHTML",
      "bd-class": "className",
    }

    if (!Array.isArray(calcScope[path])) calcScope[path] = []
    calcScope[path].push({ prop: eqs[attr], fn, el })

    const doc = connection.get("boydog", path)
    subscribeDoc(doc, path, el)
  }

  ;[...attrCalculables, attrModel].forEach((attr) => {
    $(`[${attr}]`).each((i, el) => {
      const attrVal = el.getAttribute(attr)
      const p = acorn.parse(attrVal)

      if (attr === attrModel) {
        if (p.body.length !== 1) return console.log("Error: Malformed bd-model. The bd-model attribute allows only one line expressions.")
        if (p.body[0].expression.type !== "Identifier" && p.body[0].expression.type !== "MemberExpression")
          return console.log("Error: Malformed bd-model. The bd-model attribute allows only expressions that don't require any calculations.")

        const path = astring.generate(p.body[0]).slice(0, -1)
        processModel(path, el)
      } else {
        acornWalk.simple(p, {
          Identifier(node) {
            const path = node.name
            processCalculable(path, attr, attrVal, el)
          },
          MemberExpression(node) {
            const path = astring.generate(node)
            processCalculable(path, attr, attrVal, el)
          },
        })
      }
    })
  })

  console.log("Boydog client connected.")
}

console.log("Boydog client found. Now run `boydog.init(scope, host)` to begin sharing in real-time.")

window.boydog = { init }
