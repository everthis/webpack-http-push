#!/usr/bin/env node

const http = require("http")
const formidable = require("formidable")
const fs = require("fs")
const path = require("path")
const mkdirp = require("mkdirp")
const PORT = parseInt(process.argv[2]) || 3072

const server = http.createServer(function (req, res) {
  function error(err) {
    res.writeHead(500, { "Content-Type": "text/plain" })
    res.end(err.toString())
  }

  function next(from, to) {
    fs.readFile(from, function (err, content) {
      if (err) {
        error(err)
      } else {
        fs.writeFile(to, content, function (err) {
          if (err) {
            error(err)
          }
          res.writeHead(200, { "Content-Type": "text/plain" })
          res.end("0")
        })
      }
    })
  }

  if (req.url == "/") {
    res.writeHead(200, { "content-type": "text/html" })
    res.end("ready!!!")
  } else if (req.url == "/receiver" && req.method.toLowerCase() == "post") {
    const form = new formidable.IncomingForm()
    form.parse(req, function (err, fields, files) {
      if (err) {
        error(err)
      } else {
        const to = fields["to"]
        const token = fields["token"]
        if (token !== "/**** token ***/") {
          error("token error")
          return
        }

        fs.exists(to, function (exists) {
          if (exists) {
            fs.unlink(to, function (err) {
              next(files.file.path, to)
            })
          } else {
            fs.exists(path.dirname(to), function (exists) {
              if (exists) {
                next(files.file.path, to)
              } else {
                mkdirp(path.dirname(to), 0777, function (err) {
                  if (err) {
                    error(err)
                    return
                  }
                  next(files.file.path, to)
                })
              }
            })
          }
        })
      }
    })
  }
})

server.listen(PORT, function () {
  console.log("receiver listening *:" + PORT)
})
