(function () {
    'use strict';

    var apServices = angular.module('ap.services',[])
    apServices.factory('apWebService', ['$http', '$rootScope', '$timeout', apWebService]);
    function apWebService($http, $rootScope, $timeout) {

        if (!$rootScope.hostName) { $rootScope.hostName = "/";}
		var service = {
			runService: runService
        };

		function runService(serviceName, params) {
		    var formMapping, listMapping, debug;
			if (typeof serviceName == "object") {
			    var paramsInput = params;
			    params = serviceName.params;
				formMapping = serviceName.formMapping;
				listMapping = serviceName.listMapping;
				debug = serviceName.debug || $rootScope.debug;
				serviceName = serviceName.name;
			} else {
				debug = debug||$rootScope.debug;
			}
			if (typeof params == "function") { params = params(paramsInput); }
			return new Promise(function (fulfill, reject){
				var wsURL = getURL(serviceName, params, debug);
				console.log('Calling Service: ' + wsURL);
				$http.get(wsURL).success(function (data) {
					console.log(data);
					var wsResult = analyzeWebServiceObj(serviceName,data);
					var listSrc = wsResult.Array;
					if (formMapping) { wsResult.Form = mapObject(wsResult.Elements, formMapping); }
					if (listMapping) { wsResult.List = mapList(wsResult.Array, listMapping); }
					if (data.Error === '') {
					    reject(data);
					} else if (debug) {// simulate server delay
						//$timeout(function(){
							fulfill(wsResult);
						//}, 1000);
					} else {
						fulfill(wsResult);
					}
				}).error(function (data) {
					console.log('Error getting data from '+serviceName);
					console.log(data);
					alert('Error getting data from '+serviceName);
					reject(data);
				});
			});
		}

		// helper private functions
		function getURL(serviceName, params, debug) {
			var url = "ServiceManager/Macro/ExecMacro/"
			if (debug) { url = "debug/"; }
			else { url = $rootScope.hostName + url; }
			var paramsString = getQueryString(params);
			return url + serviceName + (debug?'.json':'') + "?" + paramsString + "&json=true";
		}
		function getQueryString(params) {
			var dataArray = new Array();
			for (var key in params) {
			  if (params.hasOwnProperty(key)) {
				var itemId,itemValue;
				if (typeof params[key] == "object") {
					if (!(params[key].hasOwnProperty('id')&&params[key].hasOwnProperty('value'))) { continue; }
					itemId = params[key].id;
					if (itemId===null || itemId.length===0) { continue; }
					itemValue=params[key].value;
				} else {
					itemId=key;
					itemValue=params[key];
					if (itemValue===undefined) { continue; }
				}
				itemValue = encodeURIComponent(itemValue);
				dataArray.push(itemId + "="+(itemValue.length>0?itemValue:"null"));
			  }
			}
			return dataArray.join("&");
		}
		function analyzeWebServiceObj(serviceName,obj) {
			obj=obj.Response?obj.Response:obj.macroreply;
			var returnObj = {};
			var msg = obj[serviceName+'Message'];
			if (msg!==undefined){
				returnObj.PopupMessages = (msg.PopupMessages!==undefined)?msg.PopupMessages:"";
				returnObj.StatusBarMessages = (msg.StatusBarMessages!==undefined)?msg.StatusBarMessages:"";
				returnObj.Error = (msg.Error!==undefined)?msg.Error:"";
			} else {
				returnObj.PopupMessages = returnObj.StatusBarMessages = "";
				returnObj.Error = obj.Error?obj.Error:"";
			}
			returnObj.Elements = (obj[serviceName+'Elements']!==undefined&&obj[serviceName+'Elements']!=="")?obj[serviceName+'Elements']:[];
			var TableArray = obj[serviceName+'TableArray'];
			if (TableArray!==undefined&&TableArray!==""){
				returnObj.Array = (TableArray[serviceName+'ArrayItem']!==undefined&&TableArray[serviceName+'ArrayItem']!=="")?TableArray[serviceName+'ArrayItem']:[];
			} else {
				returnObj.Array = [];
			}
			if (returnObj.Error!=="") { alert('WS Reported an Error: ' + returnObj.Error + '\nStatusBarMessages: ' + returnObj.StatusBarMessages); }
			return returnObj;
		}
		function mapObject(obj, mapping) {
		    var newObj = Object.create(obj);
			for (var key in mapping){
				if (mapping.hasOwnProperty(key)) { newObj[key] = obj[mapping[key]]; }
			}
			if (typeof mapping.init == 'function') {
			    newObj.init = mapping.init;
			    newObj.init();
			}
			return newObj;
		}
		function mapList(list, mapping) {
		    var newList = [];
		    var seen;
		    if (typeof mapping.filter == 'function'){
		        seen = {};
		    }
		    for (var i in list) {
		        if (seen) {
		            var key = mapping.filter(list[i]);
		            if (key && !seen.hasOwnProperty(key)) {
		                seen[key] = true;
		                newList.push(mapObject(list[i], mapping));
		            }
		        } else {
		            newList.push(mapObject(list[i], mapping));
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
                        if (loginResult.Error !== '' || loginResult.PopupMessages !== '') { loginResult.success = false; }
                        else {
                          loginResult.success = true;
                        }
                        callback(loginResult);
                    },
                    function (loginResult) { // rejected
                        if (loginResult) {
                            callback({ success: false, Error: loginResult });
                        } else { callback({ success: false, Error: 'Unknown Error' }); }
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
                $rootScope.currentUser = {};
                $localstorage.setObject('CurrentUser', {});
                //$http.defaults.headers.common.Authorization = 'Basic ';
            };
            service.init = function () {
                $rootScope.currentUser = $localstorage.getObject('CurrentUser') || {};
                if ($rootScope.currentUser) {
                    $rootScope.alreadyLogged = true;
                    $rootScope.debug = $rootScope.currentUser.debug;
                    //$http.defaults.headers.common['Authorization'] = 'Basic ' + $rootScope.globals.currentUser.authdata; // jshint ignore:line
                    console.log($rootScope.currentUser);
                }
            }

            return service;
        }]);
    apServices.factory('$localstorage', ['$rootScope', '$window', function ($rootScope, $window) {
        return {
            set: function(key, value) {
                $window.localStorage[$rootScope.appId + key] = value;
            },
            get: function(key, defaultValue) {
                return $window.localStorage[$rootScope.appId + key] || defaultValue;
            },
            setObject: function(key, value) {
                $window.localStorage[$rootScope.appId + key] = JSON.stringify(value);
            },
            getObject: function(key) {
                return JSON.parse($window.localStorage[$rootScope.appId + key] || '{}');
            }
        }
    }]);
})();
