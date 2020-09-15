var CamEngine = (function() {
    
    var stream;               // stream obtained from webcam
    var video;                // video receiving stream
    var captureCvs;           // internal canvas capturing full images from video
    var captureCtx;           // context for capture canvas
    var procCvs;              // processing canvas
    var procCtx;              // context for processing canvas
    var outputCvs;            // canvas receiving processed images
    var outputCtx;            // context of output canvas

    var initSuccessCallback;  // called when init succeeds
    var initErrorCallback;    // called when init fails
    var successCallback;      // called after start
    var captureCallback;      // called after capture of an image occurred
    var processor;            // called while processing images

    var captureInterval;      // interval for continuous captures
    var captureIntervalTime;  // time between captures in [ms]
    var doProcess;            // processor is only called if doProcess is true
    var captureWidth;         // captured image width
    var captureHeight;        // captured image height
    var procWidth;            // processing image width
    var procHeight;           // processing image height
    var outputWidth;          // (downscaled) output image width
    var outputHeight;         // (downscaled) output image height


    function init(options) {
        if (!options) { // sanity check
            throw 'No options provided';
        }

        //// option defaults
        video = options.video || document.createElement('video');
        captureCvs = document.createElement('canvas');
        procCvs = document.createElement('canvas');
        outputCvs = options.outputCvs || document.createElement('canvas');
        // callbacks
        initSuccessCallback = options.initSuccessCallback || function() {};
        initErrorCallback = options.initErrorCallback || function() {};
        successCallback = options.successCallback || function() {};
        captureCallback = options.captureCallback || function() {};
        processor = options.processor || null;
        if (typeof processor === 'function') {
            doProcess = true;
        } else {
            doProcess = doProcess || false;
        }
        // misc
        captureIntervalTime = options.captureIntervalTime || 100;
        captureWidth = options.captureWidth || 640;
        captureHeight = options.captureHeight || 480;
        procWidth = options.procWidth || 64;
        procHeight = options.procHeight || 48;
        outputWidth = procWidth;
        outputHeight = procHeight;
        
        
        //// setting up components
        // video
        video.setAttribute('autoplay', '');
        // video.setAttribute('muted', '');
        video.setAttribute('playsinline', '');
        // capture canvas
        captureCvs.width = captureWidth;
        captureCvs.height = captureHeight;
        captureCtx = captureCvs.getContext('2d');
        // processing canvas
        procCvs.width = procWidth;
        procCvs.height = procHeight;
        procCtx = procCvs.getContext('2d');
        // output canvas
        outputCvs.width = outputWidth;
        outputCvs.height = outputHeight;
        outputCtx = outputCvs.getContext('2d');

        // macOS / iOS hack for avoiding video cam freeze
        setTimeout(function () {
            video['play']();
        }, 100);

        requestWebcam();
        
    }

    
    function requestWebcam() {

        var constraints = {
            audio: false,
            video: {facingMode: { ideal: 'environment' },
                    width: captureWidth,
                    height: captureHeight}
        };

        navigator.mediaDevices.getUserMedia(constraints)
            .then(initSuccess)
            .catch(initError);
    }

    
    function initSuccess(requestedStream) {
        stream = requestedStream;
        initSuccessCallback();
    }


    function initError(error) {
        console.log(error);
        initErrorCallback();
    }

    
    function start() {

        if (!stream) {
            throw 'Cannot start after CamEngine initialization fail'
        };

        video.addEventListener('canplay', startSuccess);
        video.srcObject = stream;
    }


    function startSuccess() {
        video.removeEventListener('canplay', startSuccess);
        captureInterval = setInterval(capture, captureIntervalTime);
        successCallback();
    }


    function stop() {
        clearInterval(captureInterval);
        video.src = '';
        outputCtx.clearRect(0, 0, outputWidth, outputHeight);
    }


    function capture() {
        captureCtx.drawImage(video, 0, 0, captureWidth, captureHeight);
        var captureImageData = captureCtx.getImageData(0, 0, captureWidth, captureHeight);

        // process image data
        procCtx.drawImage(video, 0, 0, procWidth, procHeight);
        var procImageData = procCtx.getImageData(0, 0, procWidth, procHeight);
        if (doProcess) {
            procImageData = processor(procImageData);
        };

        // callback
        captureCallback({
            imageData: captureImageData,
            getURL: function() {
                return getCaptureURL(this.imageData)
            }
        });

        // write to output canvas
        outputCtx.putImageData(procImageData, 0, 0);
        
    }


    function getCaptureURL(captureImageData) {
        captureCtx.putImageData(captureImageData, 0, 0);
        return captureCvs.toDataURL();
    }

    return {
        init: init,
        start: start,
        stop: stop
    };
    
    
})();
