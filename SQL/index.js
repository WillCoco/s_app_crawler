const Queue = require('promise-queue-plus');
// const base = require('./base');


const delay = (ms = 1000) =>
  () =>
    new Promise((resolve) => {
      setTimeout(() => {
        resolve();
        console.log(ms);
      }, ms)
    });


const queue1 = new Queue(1, {
  "retry":0               //Number of retries
  ,"retryIsJump":false     //retry now?
  ,"timeout":0            //The timeout period
});

queue1.go(delay(3000));
queue1.go(delay(2000));
queue1.go(delay());
queue1.go(delay());

