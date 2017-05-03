((global) => {

const connections = new Map();
const ports = new Map();
const kInitialAppType = new URL(location.href).searchParams.get('app') ||
    'demo';

function makeToken() {
  let array = new Uint32Array(5);
  crypto.getRandomValues(array);
  return array.join('-');
}

function addPendingFrame(appType, parent) {
  let token = makeToken();
  connections.set(token, {
    appType: appType,
    parent: parent,
    target: null,
    services: null,
    client: null,
  });
  return token;
}

function setupInitialFrame() {
  let token = addPendingFrame(kInitialAppType, window);
  let iframe = document.createElement('iframe');
  iframe.src = `/frame.html?token=${token}`;
  iframe.sandbox = 'allow-scripts';
  global.addEventListener('DOMContentLoaded', (event) => {
    document.body.appendChild(iframe);
  });
}

class AppLoaderService {
  static get exposed() { return ['requestLoad']; }

  requestLoad(appType, event) {
    let source = ports.get(event.target);
    return addPendingFrame(appType, source);
  }
};

function createServiceContext(port) {
  let services = new ServiceContext(port);
  services.register('apploader', AppLoaderService);
  port.start();
  return services;
}

global.addEventListener('message', (event) => {
  let data = Array.from(event.data);
  let source = event.source;
  let origin = event.origin;
  if (origin !== 'null')
    throw new Error(`Connection from non-sandboxed origin '${origin}'.`);
  let messageType = data[0];
  if (messageType != 'setup')
    throw new Error(`Invalid messageType: '${messageType}'.`);
  let token = data[1];
  let connection = connections.get(token);
  if (!connection)
    throw new Error(`No connection for token: '${token}'.`);
  if (connection.parent != source.parent)
    throw new Error(`Invaid parent for: '${token}'.`);
  connection.target = source;
  let port = event.ports[0];
  if (!port)
    throw new Error('No port sent.');
  ports.set(port, source);
  let services = createServiceContext(port);
  connection.services = services;
  connection.client = services.connect('appclient').then((client) => {
    return client.becomeApp(connection.appType);
  });
});

// Load the initial top level app.
setupInitialFrame();

})(self);
