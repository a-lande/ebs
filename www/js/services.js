(function () {
  'use strict';

  var apServices = angular.module('ap.services', ['ui-notification']);
  apServices.factory('apWebService', ['$http', '$rootScope', '$localstorage', '$timeout', 'Notification', apWebService]);
  function apWebService($http, $rootScope, $localstorage, $timeout, Notification) {
    var cacheDic = 'cacheDic';
    var _cacheDic = undefined;

    if (!$rootScope.hostName) {
      $rootScope.hostName = "/";
    }
    var service = {};

    function displayError(errMsg) {
      console.log(errMsg);
      Notification.error({message: errMsg, delay: 10000});
    }
    function getCacheDic() {
      if (!_cacheDic) {
        _cacheDic = $localstorage.getObject(cacheDic) || {};
      }
      return _cacheDic;
    }

    function saveCacheDic() {
      $localstorage.setObject(cacheDic, _cacheDic);
    }

    function getFromCache(wsURL) {
      if (getCacheDic()[wsURL]) {
        //todo: check if the service needs refresh
        return $localstorage.getObject(wsURL);
      } else {
        return undefined;
      }
    }

    function setToCache(wsURL, data) {
      $localstorage.setObject(wsURL, data);
      _cacheDic[wsURL] = {updated: new Date()};
      saveCacheDic();
    }

    service.clearCache = function () {
      var dic = getCacheDic();
      for (var key in dic) {
        if (dic.hasOwnProperty(key)) {
          $localstorage.setObject(key, undefined);
        }
      }
      _cacheDic = undefined;
      saveCacheDic();
    }
    service.runService = function (serviceName, params) {
      var formMapping, listMapping, cache, debug = false;
      if (typeof serviceName == "object") {
        var paramsInput = params;
        params = serviceName.params;
        formMapping = serviceName.formMapping;
        listMapping = serviceName.listMapping;
        cache = serviceName.cache;
        debug = serviceName.debug || $rootScope.debug;
        serviceName = serviceName.name;
      } else {
        debug = debug || $rootScope.debug;
      }
      if (typeof params == "function") {
        params = params(paramsInput);
      }
      return new Promise(function (fulfill, reject) {
        if (!serviceName || serviceName == '') {
          displayError('AuraPlayer Service mast have a name');
          reject({error: 'AuraPlayer Service mast have a name'});
          return;
        }
        var wsURL = getURL(serviceName, params, debug);
        if (cache) { // trying to load the data from local storage
          console.log('trying to get data from cache: ' + wsURL);
          var cacheSrv = getFromCache(wsURL);
          if (cacheSrv) {
            console.log(cacheSrv);
            fulfill(cacheSrv);
            return;
          }
        }
        console.log('Calling Service: ' + wsURL);
        $http.get(wsURL).success(function (data) {
          console.log(data);
          var wsResult = analyzeWebServiceObj(serviceName, data);
          if (formMapping) {
            wsResult.Form = mapObject(wsResult.Elements, formMapping);
          }
          if (listMapping) {
            wsResult.List = mapList(wsResult.Array, listMapping);
          }
          if (wsResult.Error != '') {
            reject(data);
          } else {
            if (cache) {
              setToCache(wsURL, wsResult);
            }
            if (debug) {// simulate server delay
              //$timeout(function(){
              fulfill(wsResult);
              //}, 1000);
            } else {
              fulfill(wsResult);
            }
          }
        }).error(function (data) {
          displayError('Error getting data from ' + serviceName);
          console.log(data);
          reject(data);
        });
      });
    };

    // helper private functions
    function getURL(serviceName, params, debug) {
      var url = "ServiceManager/Macro/ExecMacro/";
      if (debug) {
        url = "debug/";
      }
      else {
        url = $rootScope.hostName + url;
      }
      var paramsString = getQueryString(params);
      return url + serviceName + (debug ? '.json' : '') + "?" + paramsString + "&json=true";
    }

    function getQueryString(params) {
      var dataArray = [];
      for (var key in params) {
        if (params.hasOwnProperty(key)) {
          var itemId, itemValue;
          if (typeof params[key] == "object") {
            if (!(params[key].hasOwnProperty('id') && params[key].hasOwnProperty('value'))) {
              continue;
            }
            itemId = params[key].id;
            if (itemId === null || itemId.length === 0) {
              continue;
            }
            itemValue = params[key].value;
          } else {
            itemId = key;
            itemValue = params[key];
            if (itemValue === undefined) {
              continue;
            }
          }
          itemValue = encodeURIComponent(itemValue);
          dataArray.push(itemId + "=" + (itemValue.length > 0 ? itemValue : "null"));
        }
      }
      return dataArray.join("&");
    }

    function analyzeWebServiceObj(serviceName, obj) {
      obj = obj.Response ? obj.Response : obj.macroreply;
      var returnObj = {};
      var msg = obj[serviceName + 'Message'];
      if (msg !== undefined) {
        returnObj.PopupMessages = (msg.PopupMessages !== undefined) ? msg.PopupMessages : "";
        returnObj.StatusBarMessages = (msg.StatusBarMessages !== undefined) ? msg.StatusBarMessages : "";
		returnObj.FRMList = returnObj.StatusBarMessages.split(";").filter(function (msg) {
				return msg.startsWith('FRM-');
			});
        returnObj.Error = (msg.Error !== undefined) ? msg.Error : "";
      } else {
        returnObj.PopupMessages = returnObj.StatusBarMessages = "";
        returnObj.Error = obj.Error ? obj.Error : "";
      }
      returnObj.Elements = (obj[serviceName + 'Elements'] !== undefined && obj[serviceName + 'Elements'] !== "") ? obj[serviceName + 'Elements'] : [];
      var TableArray = obj[serviceName + 'TableArray'];
      if (TableArray !== undefined && TableArray !== "") {
        returnObj.Array = (TableArray[serviceName + 'ArrayItem'] !== undefined && TableArray[serviceName + 'ArrayItem'] !== "") ? TableArray[serviceName + 'ArrayItem'] : [];
      } else {
        returnObj.Array = [];
      }
      if (returnObj.Error !== "") {
        displayError('AuraPlayer Service Reported an Error: ' + returnObj.Error + '<br>StatusBarMessages: ' + returnObj.StatusBarMessages);
      }
      return returnObj;
    }

    function mapObject(obj, mapping) {
      var newObj = Object.create(obj);
      for (var key in mapping) {
        if (mapping.hasOwnProperty(key)) {
          newObj[key] = obj[mapping[key]];
        }
      }
      if (typeof mapping.init == 'function') {
        newObj.init = mapping.init;
        newObj.init();
      }
      return newObj;
    }

    function mapList(list, mapping) {
      // init the list
      var newList = [];
      if (mapping.key) {
        newList = {};
      } else {
        newList = [];
      }
      for (var i in list) {
        if (typeof list[i] != 'object') {
          continue;
        }
        var newObj = mapObject(list[i], mapping);
        if (typeof mapping.filter == 'function' && !mapping.filter(newObj)) {
          continue;
        }
        var key = undefined;
        if (newObj.hasOwnProperty('key')) {
          key = newObj.key;
        } else if (typeof mapping.key == 'function') {
          key = mapping.key(newObj);
        }
        if (key) {
          if (i == 0) newList = {};
          if (!newList.hasOwnProperty(key)) {
            newList[key] = newObj;
          }
        } else {
          newList.push(newObj);
        }
      }
      return newList;
    }

    return service;
  }

  apServices.factory('AuthService', ['$http', '$localstorage', '$rootScope', 'apWebService',
    function ($http, $localstorage, $rootScope, apWebService) {
      var service = {};

      service.Login = function (LoginSvc, callback) {
        console.log('attempting login');
        console.log('debug:' + LoginSvc.debug);
        apWebService.runService(LoginSvc).then(
          function (loginResult) { // fulfill
            loginResult.success = (loginResult.Error === '' && loginResult.PopupMessages === '');
            callback(loginResult);
          },
          function (loginResult) { // rejected
            if (loginResult) {
              callback({success: false, Error: loginResult});
            } else {
              callback({success: false, Error: 'Unknown Error'});
            }
          }
        );
      };

      service.SetCredentials = function (user) {
        $rootScope.currentUser = user;
        $rootScope.debug = user.debug;
        //$http.defaults.headers.common['Authorization'] = 'Basic ' + authdata; // jshint ignore:line
        $localstorage.setObject('CurrentUser', $rootScope.currentUser);
      };

      service.ClearCredentials = function () {
        //$http.get('/ServiceManager/Macro/Logout', {});
        $rootScope.currentUser = undefined;
        $localstorage.setObject('CurrentUser', undefined);
        //$http.defaults.headers.common.Authorization = 'Basic ';
      };
      service.init = function () {
        $rootScope.currentUser = $localstorage.getObject('CurrentUser');
        if ($rootScope.currentUser) {
          $rootScope.debug = $rootScope.currentUser.debug;
          //$http.defaults.headers.common['Authorization'] = 'Basic ' + $rootScope.globals.currentUser.authdata; // jshint ignore:line
          console.log($rootScope.currentUser);
        }
      };

      return service;
    }]);
  apServices.factory('$localstorage', ['$rootScope', '$window', function ($rootScope, $window) {
    return {
      set: function (key, value) {
        $window.localStorage[$rootScope.appId + key] = value;
      },
      get: function (key, defaultValue) {
        return $window.localStorage[$rootScope.appId + key] || defaultValue;
      },
      setObject: function (key, value) {
        $window.localStorage[$rootScope.appId + key] = JSON.stringify(value);
      },
      getObject: function (key) {
        if (!$window.localStorage[$rootScope.appId + key] || $window.localStorage[$rootScope.appId + key]=='undefined') return undefined;
        return JSON.parse($window.localStorage[$rootScope.appId + key] || '{}');
      }
    }
  }]);
  // polyfills
  if (!String.prototype.startsWith) {
    String.prototype.startsWith = function (searchString, position) {
      position = position || 0;
      return this.indexOf(searchString, position) === position;
    };
  }
})();
