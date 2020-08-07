const fs = require("fs")
const path = require("path")
const u = require("underscore")
const request = require("request")
const log = require("log-util")
const chalk = require("chalk")

function upload(url, data, filepath, subpath, callback) {
  const formData = u.extend(data, {
    file: {
      value: fs.createReadStream(filepath),
      options: {
        filename: subpath,
      },
    },
  })
  request.post(
    {
      url,
      formData,
    },
    function (err, res, body) {
      if (err) {
        callback(err)
        return
      }
      callback()
    }
  )
}

/**
 * http上传插件
 *
 * @param options
 * @param options.receiver
 * @param options.to
 * @param options.token
 *
 * @constructor
 */
function HttpPushWebpackPlugin(options) {
  this.options = options
}

HttpPushWebpackPlugin.prototype.apply = function (compiler) {
  if (compiler) {
    compiler.plugin("after-emit", (data, cb) => {
      this.upload(data, cb)
    })
  }
}

HttpPushWebpackPlugin.prototype.upload = function (compilation, cb) {
  const assets = compilation.assets
  const opt = this.options
  u.each(assets, (item, filename) => {
    const subpath = path.basename(filename)
    upload(
      opt.receiver,
      {
        token: opt.token,
        to: opt.to + "/" + filename,
      },
      item.existsAt,
      subpath,
      (err, res) => {
        if (err) {
          log.error(filename + " - " + chalk.red("[error] [" + err + "]"))
        } else {
          log.info(filename + chalk.green(" [DONE]"))
        }
      }
    )
  })
  cb()
}

module.exports = HttpPushWebpackPlugin
