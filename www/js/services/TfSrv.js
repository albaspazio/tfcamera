

function TfSrv($window, $q, $cordovaTransfer, FileSystemSrv)
{
    var service     = {};    
    service.tf      = null;
    service.models  = null;
    service.FIELDS  = null;
    

    service.initTF = function(modelName, downloadprogr)
    {
        service.resolvedOutDataFolder   = FileSystemSrv.setUnresolvedOutDataFolder("externalRootDirectory");
        service.relModelsFolder         = "tfcamera/models";
        service.FIELDS                  = $window.TensorFlow._modelFields;
        service.models                  = $window.TensorFlow._models;
        service.tf                      = new TensorFlow(modelName);
        
        if(downloadprogr != null) service.tf.onprogress = downloadprogr;
            
        return FileSystemSrv.createDir(service.relModelsFolder, false)
        .then(function(){
            return service.checkCached(service.tf.model)
        })
        .then(function(isCached) {
            if (isCached)   return true;
            else            return service.downloadModelZip(service.tf.model, service.tf.onprogress)
                            .then(function(result){
                                return service.unzipModel()
                            })
                            .then(function(result){
                                if (result == -1) return $q.reject('Error unzipping file');
                                service.tf.model.cached = true;
                                return true; // it calls the .then() even without the return
                            })
        })
        .then(function() {
            console.log("Model " + modelName + " available");
            return service.initClassifier(service.tf.model, service.tf.onprogress);
        })
        .then(function(res) {  // plugin returns "OK" by callbackContext.success();
            if(res == "OK")
            {
                console.log("Model " + modelName + " loaded");
                service.canClassify = true;
            }
            else
            {
                service.canClassify = false;  
                console.log('ERROR: Classifier init');   
                return false;
            }
        })
        .catch(function(err){
            service.canClassify = false;  
            console.log(err);
            return false;
        });
    };

    service.checkCached = function (model) 
    {
        var zipUrl = model.model_path.split('#')[0];
        if (model.label_path.indexOf(zipUrl) == -1) {
            return $q.reject('Model and labels must be in same zip file!');
        }
        var modelZipName        = model.model_path.replace(zipUrl + '#', '');
        var labelZipName        = model.label_path.replace(zipUrl + '#', '');
        var zipPath             = service.getPath(model.id + '.zip');
        var dir                 = service.getPath(model.id);

        model.local_model_path  = dir + '/' + modelZipName;
        model.local_label_path  = dir + '/' + labelZipName;

        return FileSystemSrv.existFile(model.id + "/" + modelZipName);
    };

    service.unzipModel = function () 
    {
        var promise = new Promise(function(resolve, reject) {
            successCallback = resolve;
            errorCallback = reject;
        });  
        
        service.tf.onprogress({
            'status': 'unzipping',
            'label': 'Extracting contents'
        });
        zip.unzip(service.zipPath, service.dir, successCallback)
        
        return promise;
    };

    service.downloadModelZip = function (model, progressCallback) 
    {
        var promise = new Promise(function(resolve, reject) {
            successCallback = resolve;
            errorCallback = reject;
        });        
        
        var zipUrl          = model.model_path.split('#')[0];
        service.zipPath     = service.getPath(model.id + '.zip');
        service.dir         = service.getPath(model.id);
        var fileTransfer    = new FileTransfer();

        progressCallback({
            'status': 'downloading',
            'label': 'Downloading model files',
        });
        fileTransfer.onprogress = function(evt) {
            var perc;
            var label = 'Downloading';
            if (evt.lengthComputable) {
                perc = "Downloaded " + Math.round((evt.loaded/evt.total)*100) + "% of " + Math.round(evt.total/1024) + " Mb";
                label += ' (' + evt.loaded + '/' + evt.total + ')';
            } else {
                label += '...';
                perc += '...';
            }
            progressCallback({
                'status': 'downloading',
                'label': perc,
                'detail': evt
            });
        };
        fileTransfer.download(zipUrl, service.zipPath, successCallback, errorCallback)
        
        return promise;
    };

    service.initClassifier = function(model, progressCallback) 
    {
        var promise = new Promise(function(resolve, reject) {
            successCallback = resolve;
            errorCallback = reject;
        });           
        
        var modelPath = (model.local_model_path || model.model_path),
            labelPath = (model.local_label_path || model.label_path);
        modelPath = modelPath.replace(/^file:\/\//, '');
        labelPath = labelPath.replace(/^file:\/\//, '');
        progressCallback({
            'status': 'initializing',
            'label': 'Initializing classifier'
        });
        cordova.exec(successCallback, errorCallback,"TensorFlowPlugin", "loadModel", [
            model.id,
            modelPath,
            labelPath,
            model.input_size,
            model.image_mean,
            model.image_std,
            model.input_name,
            model.output_name
        ]);
        
        return promise;
    };  

    service.getPath = function (filename, pathroot) 
    {
        return service.resolvedOutDataFolder + service.relModelsFolder + "/" + filename;
    }

    service.registerModel = function (modelId, model) 
    {
        service.FIELDS.forEach(function(field) {
            if (!model[field]) {
                throw 'Missing "' + field + '" on model description';
            }
        });

        if (model.model_path.match(/^http/) || model.label_path.match(/^http/)) {
            model.cached = false;
        } else {
            model.cached = true;
        }
        model.id = modelId;
        return model;
    };    

    service.classifyImage = function(imageData)
    {
        var promise = new Promise(function(resolve, reject) {
            successCallback = resolve;
            errorCallback = reject;
        });
        cordova.exec(
            successCallback, errorCallback,
            "TensorFlowPlugin", "classify", [service.tf.modelId, imageData]
        );
        return promise;        
    };
    
    service.addModel = function(modelid, modelobj)
    {
        service.FIELDS  = $window.TensorFlow._modelFields;
        service.models  = $window.TensorFlow._models;
        service.models.add(registerModel(modelid, modelobj));
    };

    return service;
};
main_module.service('TfSrv', TfSrv);




//    service.downloadModelZip = function(model, progressCallback) 
//    {
//        var zipUrl          = model.model_path.split('#')[0];
//        var zipPath         = service.getPath(model.id + '.zip');
//        var dir             = service.getPath(model.id);
//
//        progressCallback({
//            'status': 'downloading',
//            'label': 'Downloading model files',
//        });
//        
//        var transfer = new $cordovaTransfer();
//        
////        $cordovaTransfer.onProgress = function(evt) {
//        transfer.onProgress = function(evt) {
//            var label = 'Downloading';
//            if (evt.lengthComputable) {
//                label += ' (' + evt.loaded + '/' + evt.total + ')';
//            } else {
//                label += '...';
//            }
//            progressCallback({
//                'status': 'downloading',
//                'label': label,
//                'detail': evt
//            });
//        };
//        
//        return transfer.download(zipUrl, zipPath)
//        .then(function(){
//            progressCallback({
//                'status': 'unzipping',
//                'label': 'Extracting contents'
//            });
//            zip.unzip(zipPath, dir, function(result) {
//                if (result == -1) {
//                    return $q.reject('Error unzipping file');
//                }
//                return true;
//            });
//        })
//        .catch(function(err){
//            return $q.reject('Error downloading file');
//        });
//    };
