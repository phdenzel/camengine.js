// Grabbing settings
var ww = window.innerWidth;
var wh = window.innerHeight;
var video = document.getElementById('video');
var dst = document.getElementById('dst');


function initSuccess() {
    console.log('CamEngine starting...');
    CamEngine.start();
}


function alertError(error) {
    console.log(error);
    alert('Error while accessing user media' + error.toString());
}


CamEngine.init({
    video: video,
    captureWidth: 1980,
    captureHeight: 1080,
    procWidth: ww,
    procHeight: wh,
    outputCvs: dst,
    doProcess: false,
    initSuccessCallback: initSuccess,
    initErrorCallback: alertError
});
