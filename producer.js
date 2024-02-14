// Node.js packages used to communicate with ActiveMQ 
// utilising WebSocket and STOMP protocols
const StompJs = require('@stomp/stompjs');
Object.assign(global, { WebSocket: require('websocket').w3cwebsocket });

// Node.js package used to work with dates and times
const moment = require('moment');

// send the reminder "x" minutes before the appointment time
const leadTimeInMinutes = 0.1;

// create a STOMP client for ActiveMQ
const stompClient = new StompJs.Client({
    brokerURL: "ws://localhost:61614/ws"
});

// connect with the broker
stompClient.activate();
console.log("STOMP client activated...");

// once connected add messages to queue then disconnect
stompClient.onConnect = (frame) => {
    console.log("STOMP client connected...");
    publishToQueueDelayed(['kunark']);
};

let count = 0;
function publishToQueue(data) {
    let receiptId = "abcde"
    let mqData = {
        to: 1,
        body: ("Random msg")
    };
    stompClient.watchForReceipt(receiptId, function() {
        // Will be called after server acknowledges
        console.log(' ---- watchForReceipt is called receiptId : ', receiptId)
    });
    let response = stompClient.publish({
        destination: '/queue/test1',
        body: JSON.stringify(mqData),
        headers: {
            // 'content-type': 'application/json',
            receipt: receiptId
            // AMQ_SCHEDULED_DELAY: toDelayFromDate(currTime)
        }
    });
}

async function publishToQueueDelayed(data) {
    for(let i = 0; i < 10; i++) {
        count++;
        // stop condition, all application messages added to queue
        if (data.length === 0) {
            stompClient.deactivate();
            console.log("STOMP client deactivated.");
            return;
        }
    
        let mqData = {
            to: count,
            body: ("Hello " + count +", you have an appointment with us in " + leadTimeInMinutes + " minutes. See you soon.")
        };
    
       // publish the current application message to the "foo.bar" queue
        // uses AMQ_SCHEDULED_DELAY, the time in milliseconds that a message will wait
        // must be a positive value
        stompClient.watchForReceipt(count, function() {
            // Will be called after server acknowledges
            console.log(' ---- watchForReceipt is called receiptId : ', count)
        });
        let currTime = new moment()
        currTime = currTime.add(leadTimeInMinutes + (count*5), 'seconds')

        if (toDelayFromDate(currTime) > 0) {
            console.log(toDelayFromDate(currTime));
            console.log("publish...");
            let response = await stompClient.publish({
                destination: '/queue/test1',
                body: JSON.stringify(mqData),
                headers: {
                    'content-type': 'application/json',
                    AMQ_SCHEDULED_DELAY: toDelayFromDate(currTime),
                    receipt: count
                }
            });
    
            console.log(' --- RESPONSE: ', response);
        }
    }
}

// utility function, returns milliseconds
// calculates the difference between the appointment time and the current time
function toDelayFromDate(dateTime) {
    let appointmentDateTime = new moment(dateTime);
    let now = new moment();
    const delay = (moment.duration(appointmentDateTime.diff(now)).as('milliseconds'));
    const leadTimeInMilliseconds = (leadTimeInMinutes * 60 * 1000);
    return (delay - leadTimeInMilliseconds);
}