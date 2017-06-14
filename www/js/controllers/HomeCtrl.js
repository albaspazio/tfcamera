
function HomeCtrl($scope, $cordovaCamera, $ionicHistory, TfSrv)
{
    $scope.canClassify      = false;
    $scope.base64Image      = "";
    $scope.modelName        = 'inception-v1';
    
    $scope.recognizedItems  = new Array();
    
    $scope.$on('$ionicView.enter', function()
    {
        $ionicHistory.clearHistory();
        $scope.photoExist = false;
        return $scope.initTF($scope.modelName);
    });
    
    $scope.takePicture = function()
    {
        $scope.photoExist = false;
        return $cordovaCamera.getPicture({
                        destinationType: Camera.DestinationType.DATA_URL,
                        targetWidth: 480,
                        targetHeight: 360
        })
        .then(function(imageData){
            $scope.base64Image = "data:image/jpeg;base64, " + imageData;    // imageData is a base64 encoded string
            $scope.photoExist = true;
            return TfSrv.classifyImage(imageData)
        })
        .then(function(results) {
            results.forEach(function(result) {
                $scope.recognizedItems.push(result);
                console.log(result.title + " " + result.confidence);
            });
        })
        .catch(function(err){
            console.log(err);
            $scope.photoExist = false;
        });
    };
    
    $scope.onDownloadProgress = function(obj) // obj={'status', 'label', 'detail'
    {
        $scope.loadedModelLabel = obj.label;
        $scope.$apply();          
    }
    
    $scope.initTF = function(modelName)
    {
        $scope.loadedModelLabel = "Loading model";        
        return TfSrv.initTF(modelName, $scope.onDownloadProgress)
        .then(function() {
            $scope.loadedModelLabel = modelName;
            $scope.canClassify      = true;
            $scope.$apply(); 
            return 1;
        });        
    };
};

main_module.controller('HomeCtrl', HomeCtrl)