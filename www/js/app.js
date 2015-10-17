// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'starter.controllers' is found in controllers.js
angular.module('ebsApp', ['ionic', 'ionic-material', 'ebs.controllers', 'ap.services', 'ngAnimate'])

  .run(function ($rootScope, $ionicPlatform, $http, apWebService, AuthService, $state, $localstorage) {
    $rootScope.appId = 'apebs';
    $rootScope.MainTitle = '<img class="title-image" src="img/samsung$light.png"  />';
    $rootScope.hostName = 'http://52.25.115.99:8080/';
    $rootScope.$on('$stateChangeSuccess',
      function (event, toState, toParams, fromState, fromParams) {
        if (toState.name != 'login') {
          if (!$rootScope.currentUser) {
            AuthService.init();
            if ($rootScope.currentUser) {
              $rootScope.listOfClients = $localstorage.getObject('listOfClients');
              if (!$rootScope.org) {
                $rootScope.org = $localstorage.getObject('org');
              }
            } else {
              $state.go('login');
            }
          }
        }
      });
    $ionicPlatform.ready(function () {
      /*      $rootScope.$on('$locationChangeStart', function (event, next, current) {
       // redirect to login page if not logged in
       if (!$state.is('login') && !$rootScope.currentUser) {
       $state.go('login');
       }
       });*/

      if (window.cordova && window.cordova.plugins.Keyboard) {
        cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
        cordova.plugins.Keyboard.disableScroll(true);

      }
      if (window.StatusBar) {
        // org.apache.cordova.statusbar required
        StatusBar.styleDefault();
      }
    });
  })

  .config(function ($stateProvider, $urlRouterProvider) {
    $stateProvider.state('login', {
      url: '/login',
      templateUrl: 'templates/login.html',
      controller: 'LoginCtrl'
    }).state('org', {
      url: '/org',
      templateUrl: 'templates/org_select.html',
      controller: 'OrgCtrl'
    }).state('app', {
      url: '/app',
      abstract: true,
      templateUrl: 'templates/menu.html',
      controller: 'MenuCtrl'
    }).state('app.main_menu', {
      url: '/main_menu',
      views: {
        'menuContent': {
          templateUrl: 'templates/main_menu.html',
          controller: 'MainMenuCtrl'
        }
      }
    }).state('app.TagCount', {
      url: '/TagCount',
      views: {
        'menuContent': {
          templateUrl: 'templates/tag_count.html',
          controller: 'TagCountCtrl'
        }
      }
    }).state('app.CycleCount', {
      url: '/CycleCount',
      views: {
        'menuContent': {
          templateUrl: 'templates/cycle_count.html',
          controller: 'CycleCountCtrl'
        }
      }
    }).state('app.OnHand', {
      url: '/OnHand',
      abstract: true,
      views: {
        'menuContent': {
          templateUrl: 'templates/on_hand/on_hand.html',
          controller: 'OnHandCtrl'
        }
      }
    }).state('app.OnHand.List', {
      url: '/List',
      views: {
        'onHandContent': {
          templateUrl: 'templates/on_hand/on_hand_list.html',
          controller: 'OnHandListCtrl'
        }
      }
    }).state('app.OnHand.Item', {
      url: '/Item',
      views: {
        'onHandContent': {
          templateUrl: 'templates/on_hand/on_hand_item.html',
          controller: 'OnHandItemCtrl'
        }
      }
    }).state('app.SubInvTrans', {
      url: '/SubInvTrans',
      views: {
        'menuContent': {
          templateUrl: 'templates/sub_inventory.html',
          controller: 'SubInvCtrl'
        }
      }
    })


      .state('app.SearchItem', {
        url: '/SearchItem/:id',
        views: {
          'menuContent': {
            templateUrl: 'templates/item_search.html',
            controller: 'SearchItem'
          }
        }
      })


    // if none of the above states are matched, use this as the fallback
    $urlRouterProvider.otherwise('/app/main_menu');
  });
