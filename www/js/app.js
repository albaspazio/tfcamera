// Ionic Starter App



// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
main_module = angular.module('main_module', ['ionic', 'ionic.native'])

main_module
.run(function($ionicPlatform, $state, $cordovaSplashscreen) {
    $ionicPlatform.ready(function() 
    {
        if(window.cordova && window.cordova.plugins.Keyboard) {
            // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard for form inputs)
            cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);

            // Don't remove this line unless you know what you are doing. It stops the viewport from snapping when text inputs are focused. 
            // Ionic handles this internally for a much nicer keyboard experience.
            cordova.plugins.Keyboard.disableScroll(true);
            $cordovaSplashscreen.hide();
            $state.go('home');
        }
        else
        {
            alert("cordova and/or cordova.plugins.Keyboard is not present");
            ionic.Platform.exitApp();
        }        
        if(window.StatusBar) {
            StatusBar.styleDefault();
        }
    });
})
.run(function($ionicPlatform, $ionicHistory, $ionicPopup, $state) 
{
    $ionicPlatform.registerBackButtonAction(function()
    {
        // ask for user confirm after pressing back (thus trying to exit from the App)
        if($state.current.name == "home") 
        {
            $ionicPopup.confirm({ title: 'Attenzione', template: 'are you sure you want to exit?'})
            .then(function(res) {
                if (res) ionic.Platform.exitApp();
            });
        }
        else        $ionicHistory.goBack();
    }, 100);
});

main_module.config(function($stateProvider, $urlRouterProvider) {
  
    $stateProvider
    .state('init', {
        url: '/',
        templateUrl: 'templates/init.html'
    })
    .state('home', {
        url: '/home',
        templateUrl: 'templates/home.html',
        controller: 'HomeCtrl'
    })
    .state('settings', {
        url: '/settings',
        templateUrl: 'templates/settings.html',
        controller: 'SettingsCtrl'
    });
  
  $urlRouterProvider.otherwise("/");
  
});


 