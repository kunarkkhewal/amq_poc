// Node.js packages used to communicate with ActiveMQ 
// utilising WebSocket and STOMP protocols
const StompJs = require('@stomp/stompjs');
Object.assign(global, { WebSocket: require('websocket').w3cwebsocket });

// create a STOMP client for ActiveMQ
const stompClient = new StompJs.Client({
    brokerURL: "ws://localhost:61614/ws"
});

// connect with the broker
stompClient.activate();
console.log("STOMP client activated...");

// on connect subscribe to queue and consume messages
stompClient.onConnect = (frame) => {
    console.log("STOMP client connected...");

    // the queue you're interested in is identified by "test1"
    const queue = "/queue/test1";
    const headers = { ack: 'auto' };

    stompClient.subscribe(
        queue,
        onMessageCallback,
        headers
    );

}

// invoked for each received message
const onMessageCallback = (jsonMessage) => {
    try {
        const jsonObj = JSON.parse(jsonMessage.body);
        console.log(' --- JSON OBJ => ', jsonObj);
    } catch (err) {
        console.log("Payload is not a JSON...");
    }
}
