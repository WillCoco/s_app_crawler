let fs = require("fs");
let path = require("path");
let superagent = require("superagent");
const Queue = require('promise-queue-plus');
let sql = require("../SQL/base");
let { delay } = require("../utils/queue");


let startIndex; // 起始id
let len = 20; // 一次请求队列

main();

function main() {
  startIndex = getProgress();

  exec();
}

function getProgress() {
  const p = path.join(__dirname, 'config.json');
  const config = fs.readFileSync(p);
  return JSON.parse(config.toString())['progress_soul'];
}

function writeProgress(progress) {
  const p = path.join(__dirname, 'config.json');
  const config = fs.readFileSync(p);
  const data = JSON.parse(config.toString()) || {};
  data['progress_soul'] = progress;
  fs.writeFileSync(p, JSON.stringify(data));
}

function exec() {
  // 数据
  let usersInfo = [];
  let usersPost = [];

  const queue = new Queue(1, {
    "retry": 0,               //Number of retries
    "queueEnd": async function () {
      // 写数据库
      await mayWrite();

      // 写配置
      console.log('end-:', startIndex);
      writeProgress(startIndex);

      // 继续
      setTimeout(() => {
        exec();
      }, 3000)
    },
    "retryIsJump": false,     //retry now?
    "timeout": 0              //The timeout period
  });

  // 取出片urls
  const users = getUsers(startIndex, len);

  // getOne
  async function getAnUser(id) {
    const info = await superagentAsync(`https://api.soulapp.cn/html/user/getUserInfo?userId=${id}`);
    usersInfo.push(info);

    await delay(1000);
    const post = await superagentAsync(`https://api.soulapp.cn/html/post/getUserPost?userId=${id}`);
    usersPost.push(post);
    await delay(1000);

    startIndex += 1;
  }

  // 获取一段url
  function getUsers(startIndex, len) {
    const uesrs = [];
    const endIndex = startIndex + len;
    for (let i = startIndex; i < endIndex; i++) {
      queue.go(() => getAnUser(i));
    }

    return uesrs;
  }

  // 写入片
  async function mayWrite() {
    if (usersInfo.length === usersPost.length && usersInfo.length === len) {
      await insertPiece(usersInfo, usersPost);
      usersInfo = [];
      usersPost = [];
    }
  }

}


function superagentAsync(url) {
  return new Promise((resolve, reject) => {
    superagent
      .get(url)
      .end(function(req, res = {}){
        if (res) {
          const { body = {} } = res;
          resolve(body.data);
        } else {
          reject();
        }
      });
  })
}


// 写一批
async function insertPiece(a, b) {
  await sql.init();
  await sql.getDB().createDb();
  await sql.getDB().createTable();
  await sql.getDB().connectDb();
  await sql.getDB().insertRows(a, b);
  // await sql.getDB().readAllRows();
  await sql.getDB().closeDb();
}


/*
*  id范围
*  我：667000
*  最新：4700，0000
*  c.queue('https://api.soulapp.cn/html/post/getUserPost?userId=241784349');
*  c.queue([{url: 'https://api.lubanso.com:8080/openapi/spec.json'}]);
*  https.get('https://api.soulapp.cn/html/post/getUserPost?userId=2630385', res => {
*    console.log(res, 123123)
*  })
*
*  https://img.soulapp.cn
*  https://roi.soulapp.cn
*  https://api.soulapp.cn
*  https://img.soulapp.cn/measure/verify_code.json
*  https://img.soulapp.cn/h5_measure_text.json
*
*  https://api.soulapp.cn/html/post/detail?id=46304810
*  https://api.soulapp.cn/html/user/getUserInfo?userId=2630385
*  https://api.soulapp.cn/html/post/getUserPost?userId=2630385
* */
