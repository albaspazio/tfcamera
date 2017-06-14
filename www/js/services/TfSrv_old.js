

function TfSrv($window)
{
    var service     = {};    
    service.tf      = null;
    service.models  = null;
    service.FIELDS  = null;

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
        return service.tf.classify(imageData)
        .then(function(results) 
        {
            return results;
        });        
    };
    
    service.addModel = function(modelid, modelobj)
    {
        service.FIELDS  = $window.TensorFlow._modelFields;
        service.models  = $window.TensorFlow._models;
        service.models.add(registerModel(modelid, modelobj));
    };
    
    service.initTF = function(modelName, downloadprogr)
    {
        service.FIELDS  = $window.TensorFlow._modelFields;
        service.models  = $window.TensorFlow._models;
        service.tf      = new TensorFlow(modelName);
        
        if(downloadprogr != null) service.tf.onprogress = downloadprogr;
            
        return service.tf.checkCached()
        .then(function(isCached) {
            if (isCached) {
                service.canClassify = true;
                return true;
            }
            else return service.tf.load();
        })
        .then(function() {
            console.log("Model " + modelName + " loaded");
            service.canClassify = true;
            return true;
        })
        .catch(function(err){
            service.canClassify = false;  
            console.log(err);
            return false;
        });
    };

    return service;
};
 main_module.service('TfSrv', TfSrv);
//
//
//main_module.service('TfSrv', function()
//{
//    var tf      = null;
//    var models  = null;
//    var FIELDS  = null;
//
//    registerModel = function (modelId, model) 
//    {
//        FIELDS.forEach(function(field) {
//            if (!model[field]) {
//                throw 'Missing "' + field + '" on model description';
//            }
//        });
//
//        if (model.model_path.match(/^http/) || model.label_path.match(/^http/)) {
//            model.cached = false;
//        } else {
//            model.cached = true;
//        }
//        model.id = modelId;
//        return model;
//    }    
//    
//    
//    classifyImage = function(imageData)
//    {
//        tf.classify(imageData)
//        .then(function(results) 
//        {
//            return results;
//        });        
//    };
//    
//    addModel = function(modelid, modelobj)
//    {
//        FIELDS = window.TensorFlow._modelFields;
//        models  = window.TensorFlow._models;
//        models.add(registerModel(modelid, modelobj));
//    };
//    
//    initTF = function(modelName, downloadprogr)
//    {
//        FIELDS  = window.TensorFlow._modelFields;
//        models  = window.TensorFlow._models;
//        tf      = new TensorFlow(modelName);
//        
//        if(downloadprogr != null) tf.onprogress = downloadprogr;
//            
//        return tf.checkCached()
//        .then(function(isCached) {
//            if (isCached) {
//                canClassify = true;
//                return true;
//            }
//            else return $scope.tf.load();
//        })
//        .then(function() {
//            console.log("Model " + modelName + " loaded");
//            canClassify = true;
//            return true;
//        })
//        .catch(function(err){
//            canClassify      = false;  
//            console.log(err);
//            return false;
//        });
//    };
//
//    return {
//        initTF: initTF, 
//        classifyImage: classifyImage,
//        addModel: addModel
//    };
//});
