// Demo app.
(async (global) => {

let iframe1 = await apploader.createApp('helloworld');
document.body.appendChild(iframe1);

let iframe2 = await apploader.createApp('helloworld');
document.body.appendChild(iframe2);

})(self);
