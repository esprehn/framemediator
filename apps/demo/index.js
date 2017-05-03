// Demo app.
(async (global) => {

let iframe = await apploader.createApp('helloworld');
document.body.appendChild(iframe);

})(self);
