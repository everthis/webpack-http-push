const AWS = require("aws-sdk")
const fs = require("fs")
const path = require("path")
const cliProgress = require("cli-progress")
const {
  AWS_S3_ACCESS_KEY_ID,
  AWS_S3_SECRET_ACCESS_KEY,
  AWS_S3_REGION,
} = process.env
const s3 = new AWS.S3({
  apiVersion: "2006-03-01",
  accessKeyId: AWS_S3_ACCESS_KEY_ID,
  secretAccessKey: AWS_S3_SECRET_ACCESS_KEY,
  region: AWS_S3_REGION,
})

function upload(p) {
  const fileSize = p => {
    const stats = fs.statSync(p)
    return stats["size"]
  }
  function KB(num) {
    return (num / 1024) >> 0
  }
  const fp = path.join(
    __dirname,
    "..",
    "..",
    "Downloads",
    "UCmNA5Lq_400x400.jpg"
  )
  const params = p || {
    Body: fs.readFileSync(fp),
    Bucket: "webpack-http-push-test",
    Key: "example",
  }
  const progressBar = new cliProgress.SingleBar(
    {
      format: `${fp} [{bar}] {percentage}% | {total}KB | {duration_formatted}`,
    },
    cliProgress.Presets.legacy
  )
  progressBar.start(KB(fileSize(fp)), 0)
  const opts = { partSize: 5 * 1024 * 1024, queueSize: 3 }
  const up = s3.upload(params, opts, function (err, data) {
    progressBar.stop()
    if (err) console.log(err, err.stack)
    else console.log(data)
  })
  up.on("httpUploadProgress", ({ loaded, total }) => {
    progressBar.update(KB(loaded))
  })
}

module.exports = upload
