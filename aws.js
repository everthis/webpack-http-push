const AWS = require("aws-sdk")
const path = require("path")
const cliProgress = require("cli-progress")

class AWSDeployPlugin {
  constructor(options = {}){
    this.opts = options
    this.filePathMap = new Map()
    this.fileContentMap = new Map()
    const config = {
      apiVersion: "2006-03-01",
      accessKeyId: options.accessKeyID,
      secretAccessKey: options.secretAccessKey,
      region: options.region,
    }
    this.s3 = new AWS.S3(config)
  }
  upload(fp, key, content, cb) {
    const fileSize = v => {
      return Buffer.byteLength(v)
    }
    function KB(num) {
      return (num / 1024) >> 0
    }
    let k = this.filePathMap.get(key).split(this.opts.assetPathPrefix)[1]
    if(k.startsWith('/')) k = k.slice(1)
    const params = {
      Body: content,
      Bucket: this.opts.bucket,
      Key: k,
    }
    const progressBar = new cliProgress.SingleBar(
      {
        format: `${fp} [{bar}] {percentage}% | {total}KB | {duration_formatted}`,
      },
      cliProgress.Presets.legacy
    )
    progressBar.start(KB(fileSize(content)), 0)
    const opts = { partSize: 5 * 1024 * 1024, queueSize: 3 }
    const up = this.s3.upload(params, opts, function (err, data) {
      progressBar.stop()
      if (err) console.log(err, err.stack)
      else cb()
    })
    up.on("httpUploadProgress", ({ loaded, total }) => {
      progressBar.update(KB(loaded))
    })
  }
  apply(compiler) {
    compiler.hooks.afterEmit.tapAsync(
      'AWSDeployPlugin',
      (compilation, callback) => {
        const assets = compilation.assets
        const keys = Object.keys(assets)
        for(let i = 0, len = keys.length; i < len; i++) {
          const filename = keys[i]
          const item = assets[filename]
          const subpath = path.basename(filename)
          if(!this.filePathMap.get(subpath)) {
            this.filePathMap.set(subpath, item.existsAt)
          }
        }
        let p = Promise.resolve()
        for(let i = 0, len = keys.length; i < len; i++) {
          const filename = keys[i]
          const subpath = path.basename(filename)
          p = p.then(() => {
            return new Promise((resolve, reject)=> {
              this.upload(filename, subpath, this.fileContentMap.get(subpath), resolve)
            })
          })
        }
        p.then(() => callback());
      }
    );
    compiler.hooks.assetEmitted.tapAsync(
      'AWSDeployPlugin',
      (file, content, callback) => {
        const fn = path.basename(file)
        this.fileContentMap.set(fn, content)
        callback();
      }
    );
  }
}

module.exports = AWSDeployPlugin
