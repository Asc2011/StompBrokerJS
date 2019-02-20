var Frame = require('./frame');

/** Unique id generator */
function genId(type) {
  return (type ? type : 'id') + Math.floor(Math.random() * 999999999999999999999);
}

/** Send frame with socket */
function sendFrame(socket, _frame) {
  var frame = _frame;

  if (!_frame.hasOwnProperty('toString')) {
    frame = new Frame({
      'command': _frame.command,
      'headers': _frame.headers,
      'body': _frame.body
    });
  }

  if (typeof frame.body === 'object' && frame.body instanceof Buffer) {
    socket.send(frame.body, {
      binary: true
    });
  } else {
    var frame_str = frame.toString();
    socket.send(frame_str);
  }
  return true;
}

var StompUtils = {
  genId: genId,

  tokenizeDestination: function (dest) {
    return dest.substr(dest.indexOf('/') + 1).split('.');
  },

  sendCommand: function (socket, command, headers, body, want_receipt) {
    if (headers === undefined) {
      headers = {};
    }

    if (want_receipt === true) {
      headers.receipt = genId('r');
    }

    var frame = new Frame({
      'command': command,
      'headers': headers,
      'body': body
    });

    sendFrame(socket, frame);
    return frame;
  },

  sendFrame: sendFrame,

  parseFrame: function (chunk) {

    console.assert( chunk, 'corrupted frame !');
    // if (chunk === undefined) return null;

    let [stompInfo, ...body] = chunk.split('\n\n');
    let [command, ...header] = stompInfo.split('\n');
    command = command.trim();

    body = body.join('\n\n').replace(/\0$/, '');

    let headers = {'content-length': body.length} ;
    while(header.length) {
      let [k, v] = header.pop().split(':', 2);
      console.assert( k.length && v.length, "corrupt stomp-header!" )
      headers[k.trim()] = v.trim();
    }
    if (headers['content-length']) headers.bytes_message = true;

    console.info("body", typeof body, body.length, '\n', body);

    return new Frame({
      command: command,
      headers: headers,
      body:    body
    });
  }
};

module.exports = StompUtils;
