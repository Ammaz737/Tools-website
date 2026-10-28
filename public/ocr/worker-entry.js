// A hard lifetime cap also closes workers whose initialization never settles.
// The main thread normally terminates this worker much sooner on completion.
setTimeout(() => self.close(), 185000);
importScripts('/ocr/worker.min.js');
