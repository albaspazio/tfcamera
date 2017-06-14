/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */



 

function SettingsCtrl($scope, $cordovaCamera)
{
    $scope.canClassify = false;
    $scope.base64Image = "";
    $scope.modelName   = 'inception-v1';
    
    
    $scope.$on('$ionicView.enter', function(){
        $scope.photoExist = false;
//        $scope.initTF();
    });
    
    $scope.takePicture = function()
    {
        $scope.photoExist = false;
        $cordovaCamera.getPicture({
                        destinationType: Camera.DestinationType.DATA_URL,
                        targetWidth: 640,
                        targetHeight: 480
        }).then(function(imageData){
          // imageData is a base64 encoded string
            $scope.base64Image = "data:image/jpeg;base64, " + imageData;
            $scope.photoExist = true;
            return $scope.classifyImage(imageData)
        })
        .catch(function(err){
            console.log(err);
            $scope.photoExist = false;
        });
    };
    
    $scope.classifyImage = function(imageData)
    {
        $scope.tf.classify(imageData)
        .then(function(results) {
            results.forEach(function(result) {
                console.log(result.title + " " + result.confidence);
            });
        });        
    };
    
    
    $scope.initTF = function(modelName)
    {
        $scope.tf               = new TensorFlow(modelName);
        $scope.loadedModelLabel = "Loading model";
        
        $scope.tf.checkCached()
        .then(function(isCached) {
            if (isCached) {
                $scope.loadedModelLabel = "modelName";
                $scope.canClassify      = true;
                return 1;
//                $('button#download').hide();
            }
            else return $scope.tf.load();
        })
        .then(function() {
            console.log("Model " + modelName + " loaded");
            $scope.loadedModelLabel = "modelName";
            $scope.canClassify = true;
        })
        .catch(function(err){
            $scope.canClassify      = false;  
            $scope.loadedModelLabel = "error while downloading the model";
            console.log(err);
        });
    }
    
};

main_module.controller('SettingsCtrl', SettingsCtrl);