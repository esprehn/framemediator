((global) => {

// We only support <iframe sandbox> as it makes all other frames become cross
// origin preventing a frame from inserting a child and using it to listen for
// 'message' events from another frame that reaches around through
// window.frames.
if (document.origin !== 'null') {
  document.documentElement.remove();
  location.href = 'about:blank';
}

// Only trust the top origin.
const kToken = new URL(location.href).searchParams.get('token');
const kTrustedOrigin = location.ancestorOrigins[
    location.ancestorOrigins.length - 1];

function safeCaller(type, name) {
  let apply = Reflect.apply;
  let getter = Reflect.getOwnPropertyDescriptor(type.prototype, name).get;
  return function(target, ...args) {
    apply(getter, target, args);
  };
}

const stopImmediatePropagation = safeCaller(Event, 'stopImmediatePropagation');
const channel = new MessageChannel();
const trustedServices = new ServiceContext(channel.port1);
channel.port1.start();

class AppClientService {
  static get exposed() { return ['becomeApp']; }

  becomeApp(appType) {
    let script = document.createElement('script');
    let sanitizedAppType = appType.replace(/[^a-zA-Z0-9_\.]+/g, '{invalid}');
    script.src = `/apps/${sanitizedAppType}/index.js`;
    script.onerror = (event) => {
      document.body.textContent = `Missing app index.js: '${appType}'.`;
    };
    document.head.appendChild(script);
  }
};
trustedServices.register('appclient', AppClientService);

class AppLoader {
  constructor() {
    this.loader = trustedServices.connect('apploader');
  }

  async createApp(appType) {
    let loader = await this.loader;
    let token = await loader.requestLoad(appType);
    let iframe = document.createElement('iframe');
    iframe.src = `/frame.html?token=${token}`;
    iframe.sandbox = 'allow-scripts';
    return iframe;
  }
};
global.apploader = new AppLoader();

// Don't let anyone send messages to us except through the port.
global.addEventListener('message', (event) => {
  stopImmediatePropagation(event);
});

// Send the setup message.
global.top.postMessage(['setup', kToken], kTrustedOrigin, [channel.port2]);

})(self);
