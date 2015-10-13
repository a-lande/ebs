angular.module('ebs.controllers', [])

  .controller('LoginCtrl', function ($rootScope, $scope, $timeout, AuthService, $state) {
    $scope.$on('$ionicView.enter', function (e) {
      $scope.navTitle = 'Login';
      $scope.loginFail = false;
      $scope.user = {};
      //$scope.username = 'OPERATIONS';
      //$scope.password = 'welcome';
      //ionicMaterialInk.displayEffect();
    });
    $scope.doLogin = function () {
      var user = {
        SIGNON_USERNAME_0: $scope.user.name,
        SIGNON_PASSWORD_0: $scope.user.password,
        debug: ($scope.user.name.toUpperCase() == 'DEBUG' || $scope.user.name.toUpperCase == 'OFFICE')
      };
      var LoginSvc = {
        name: 'EBS_Login',
        params: user,
        listMapping: {
          init: function () {
            var sArray = this.Organizations.split(',');
            this.Id = sArray[0];
            this.Name = sArray[1];
          }
        },
        debug: ($scope.user.name.toUpperCase() == 'DEBUG' || $scope.user.name.toUpperCase == 'OFFICE')
      };
      AuthService.Login(LoginSvc, function (loginResult) {
        if (loginResult.success) {
          console.log('Login Success');
          user.Organizations = 'm1';
          AuthService.SetCredentials(user);
          console.log(loginResult.List);
          $rootScope.listOfClients = loginResult.List;
          $state.go('org');
        } else {
          console.log('Login Fail');
          $scope.loginFail = true;
          $scope.loginError = loginResult.Error != "" ? loginResult.Error : loginResult.PopupMessages;
          $scope.$apply();
        }
      });
    }
  })

  .controller('OrgCtrl', function($rootScope,$scope,$state) {
    $scope.navTitle = 'Select Organization';
    $scope.listOfClients = $rootScope.listOfClients;
    $scope.$on('$ionicView.enter', function (e) {
      $scope.selectedValues = {};
    });
    $scope.orgSelect = function(org) {
      $rootScope.org=org;
      $state.go('app.main_menu');
    }
  })

  .controller('MenuCtrl', function ($rootScope, $scope, $state) {
    $scope.$on('$ionicView.enter', function (e) {
      $scope.org=$rootScope.org;
      $scope.goto = function (state) {
        $state.go(state);
      }
    });
  })

  .controller('MainMenuCtrl', function ($rootScope, $scope, $timeout, ionicMaterialMotion, ionicMaterialInk) {
    $scope.$on('$ionicView.enter', function (e) {
      $scope.navTitle = $rootScope.MainTitle;
      $timeout(function () { // start the animations
        ionicMaterialMotion.fadeSlideIn({
          selector: '.animate-fade-slide-in .item'
        });
        ionicMaterialMotion.fadeSlideIn({
          selector: '.animate-fade-slide-in h1'
        });
        ionicMaterialInk.displayEffect();
      }, 200);
      $scope.showInfo = function () {
        angular.element('#InfoPopUp').css('visibility', 'visible');
      };

      $scope.hideInfo = function () {
        angular.element('#InfoPopUp').css('visibility', 'hidden');
      }
    });
  })

  .controller('TagCountCtrl', function ($rootScope, $scope, $ionicPopover, $timeout, $filter, apWebService) {
    $scope.$on('$ionicView.enter', function (e) {
      $scope.navTitle = 'Physical Inventory';
      $scope.countSelected = false;
      $scope.selectionScreen = true;
      $scope.headerCollapsed = true;
      $scope.selectedValues = {};
      $scope.filteredItems = [];
      var countNameSrv = {
        name: 'Inventory_Physical_Inventories_with_Date_list',
        params: function () {
          return Object.create($rootScope.currentUser);
        },
        listMapping: {
          name: 'FOLDER_PHYSICAL_INVENTORY_NAME_0',
          desc: 'FOLDER_DESCRIPTION_0',
          date: 'FOLDER_FREEZE_DATE_0'
        }
      };
      var employeesSrv = {
        name: 'nventory_Physical_defaultCounter_List',
        params: function () {
          var rv = Object.create($rootScope.currentUser);
          rv.TAG_COUNTS_CONTROL_PHYSICAL_INVENTORY_NAME_0 = $scope.selectedValues.count.name;
          return rv;
        },
        listMapping: {
          init: function () {
            var nameArr = this.TAGS_EMPLOYEES_DEFAULT.split(',');
            this.id = nameArr.pop();
            this.name = nameArr.join();
          }
        }
      };
      var UOMSrv = {
        name: 'Inventory_Primary_Unit_Of_Measure',
        params: function () {
          return Object.create($rootScope.currentUser);
        },
        listMapping: {
          init: function () {
            var nameArr = this.QF_PRIMARY_UOM_QP.split(',');
            this.id = nameArr[1];
            this.name = nameArr[0];
            this.category = nameArr[2];
          }
        }
      };
      var itemDescSrv = {
        //name: 'Inventory_Item_List',
        name: 'EBS_MasterItemDetails',
        params: function (item) {
          var rv = Object.create($rootScope.currentUser);
          rv.MTL_SYSTEM_ITEMS_INVENTORY_ITEM_MIR_0 = item;
          return rv;
        },
        formMapping: {
          desc: 'MTL_SYSTEM_ITEMS_DESCRIPTION_0'
        }
        //listMapping: {
        //    //desc: 'MTL_SYSTEM_ITEMS_DESCRIPTION_MIR_0',
        //    desc: 'MTL_SYSTEM_ITEMS_DESCRIPTION_0',
        //}
      };
      var saveSRV = {
        name: 'Inventory_Physical_Inventory_Counting',
        params: function (item) {
          var rv = Object.create($rootScope.currentUser);
          rv.TAG_COUNTS_CONTROL_PHYSICAL_INVENTORY_NAME_0 = $scope.selectedValues.count.name;
          //rv.TAG_COUNTS_ITEM_0 = item.item;
          rv.TAG_COUNTS_TAG_NUMBER_0 = item.id;
          rv.TAG_COUNTS_ITEM_0_X1 = item.item;
          rv.TAG_COUNTS_TAG_QUANTITY_D_0 = item.tmpQty;
          return rv;
        }
      };
      var mainSrv = {
        name: 'EBS_Inv_Tag_Count_Main',
        params: function () {
          var rv = Object.create($rootScope.currentUser);
          rv.TAG_COUNTS_CONTROL_PHYSICAL_INVENTORY_NAME_0 = $scope.selectedValues.count.name;
          return rv;
        },
        listMapping: {
          id: 'TAG_COUNTS_TAG_NUMBER_0',
          sub: 'TAG_COUNTS_SUBINVENTORY_0',
          location: 'TAG_COUNTS_LOCATOR_0',
          item: 'TAG_COUNTS_ITEM_0',
          lot: 'TAG_COUNTS_LOT_NUMBER_0',
          UOM: 'TAG_COUNTS_TAG_UOM_D_0',
          qty: 'TAG_COUNTS_TAG_QUANTITY_D_0',
          //filter: function (obj) {
          //    if (obj.TAG_COUNTS_TAG_NUMBER_0 == "") return;
          //    else return JSON.stringify(obj);
          //},
          init: function () {
            var currObj = this;
            currObj.isFinished = false;
            currObj.qty = parseInt(currObj.qty);
            currObj.tmpQty = undefined;
            apWebService.runService(itemDescSrv, currObj.item).then(function (data) {
              if (data !== undefined) {
                currObj.itemDesc = data.Form.desc;
                $scope.$apply();
              }
            });
          }
        },
        formMapping: {
          defaultCounter: 'TAG_COUNTS_CONTROL_DEFAULT_EMPLOYEE_NAME_0'
        }
      };

      apWebService.runService(countNameSrv).then(function (data) {
        $scope.tagCountNames = data.List;
        $scope.$apply();
      });
/*      apWebService.runService(UOMSrv).then(function (data) {
        $scope.UOMLOV = data.List;
      });*/
      $scope.countSelect = function (countName) {
        console.log(countName);
        $scope.selectedValues.count = countName;
        $scope.countSelected = true;
        apWebService.runService(mainSrv).then(function (data) {
          $scope.mainItemsList = data.List;
          $scope.selectedValues.defaultCounter = data.Form.defaultCounter;
          $scope.applyFilter();
          $scope.$apply();
        });
      };
      $scope.countReselect = function () {
        $scope.countSelected = false;
        $scope.selectedValues.defaultCounter = '';
      };
      //$scope.countNameChanged = function () {
      //    console.log($scope.tagCountNames[$scope.tagCountIndex]);
      //    $scope.selectedValues.count = $scope.tagCountNames[$scope.selectedValues.countId];
      //    apWebService.runService(mainSrv).then(function (data) {
      //        $scope.mainItemsList = data.List;
      //        $scope.selectedValues.defaultCounter = data.Form.defaultCounter;
      //        $scope.applyFilter();
      //        $scope.$apply();
      //    });
      //    //apWebService.runService(employeesSrv).then(function (data) {
      //    //    $scope.employees = data.List;
      //    //    $scope.$apply();
      //    //});
      //};
      $scope.countConfirm = function () {
        $scope.selectionScreen = false;
      };
      $scope.applyFilter = function () {
        $scope.filteredItems = $filter('filter')($scope.mainItemsList, {item: $scope.selectedValues.item}, false);
        $scope.filteredItems = $filter('orderBy')($scope.filteredItems, ['isFinished', 'id']);
        if ($scope.filteredItems.length == 1) {
          $scope.currentItem = $scope.filteredItems[0];
          $scope.selectedValues.selectedIndex = 0;
        } else {
          $scope.currentItem = {};
          $scope.selectedValues.selectedIndex = -1;
        }
      };
      $scope.itemClick = function (item, index) {
        if ($scope.currentItem !== item) {
          $scope.currentItem = item;
          $scope.selectedValues.selectedIndex = index;
          //$scope.currentItem.tmpQty = $scope.currentItem.qty;
        } else {
          $scope.clearSelectedItem();
        }
        //$scope.popover.show();
      };
      $scope.clearSelectedItem = function () {
        if ($scope.currentItem !== {}) {
          $scope.currentItem = {};
          $scope.applyFilter();
          $scope.selectedValues.selectedIndex = -1;
          $timeout(function () {
            $scope.$apply();
          }, 0);
        }
      };
      $scope.itemSave = function () {
        if ($scope.currentItem.tmpQty !== undefined && $scope.currentItem.tmpQty != $scope.currentItem.qty) {
          //save the data
          apWebService.runService(saveSRV, $scope.currentItem).then(function (data) {
            $scope.currentItem.qty = $scope.currentItem.tmpQty;
            $scope.currentItem.isFinished = true;
            $scope.clearSelectedItem();
          }, function (data) {
            alert(data.Error);
          });
        } else {
          $scope.currentItem.isFinished = true;
          $scope.clearSelectedItem();
        }
        $scope.selectedValues.item = '';
      };
      var holding = true;
      $scope.adjustQty = function (addQ, delay) {
        if (delay === undefined) delay = 500;
        holding = addQ != 0;
        $scope.currentItem.tmpQty += addQ;
        $timeout(function () {
          if (holding == true) {
            $scope.adjustQty(addQ, 200);
          }
        }, delay);
      }
    });

  })

  .controller('CycleCountCtrl', function ($rootScope, $scope, $ionicPopover, $timeout, $filter, apWebService) {
    $scope.$on('$ionicView.enter', function (e) {
      $scope.navTitle = 'Cycle Count';
      $scope.countSelected = false;
      $scope.selectionScreen = true;
      $scope.headerCollapsed = true;
      $scope.selectedValues = {};
      $scope.filteredItems = [];
      var countNameSrv = {
        name: 'Inventory_Physical_Inventories_with_Date_list',
        params: function () {
          return Object.create($rootScope.currentUser);
        },
        listMapping: {
          name: 'FOLDER_PHYSICAL_INVENTORY_NAME_0',
          desc: 'FOLDER_DESCRIPTION_0',
          date: 'FOLDER_FREEZE_DATE_0'
        }
      };
      var employeesSrv = {
        name: 'nventory_Physical_defaultCounter_List',
        params: function () {
          var rv = Object.create($rootScope.currentUser);
          rv.TAG_COUNTS_CONTROL_PHYSICAL_INVENTORY_NAME_0 = $scope.selectedValues.count.name;
          return rv;
        },
        listMapping: {
          init: function () {
            var nameArr = this.TAGS_EMPLOYEES_DEFAULT.split(',');
            this.id = nameArr.pop();
            this.name = nameArr.join();
          }
        }
      };
      var UOMSrv = {
        name: 'Inventory_Primary_Unit_Of_Measure',
        params: function () {
          return Object.create($rootScope.currentUser);
        },
        listMapping: {
          init: function () {
            var nameArr = this.QF_PRIMARY_UOM_QP.split(',');
            this.id = nameArr[1];
            this.name = nameArr[0];
            this.category = nameArr[2];
          }
        }
      };
      var itemDescSrv = {
        //name: 'Inventory_Item_List',
        name: 'EBS_MasterItemDetails',
        params: function (item) {
          var rv = Object.create($rootScope.currentUser);
          rv.MTL_SYSTEM_ITEMS_INVENTORY_ITEM_MIR_0 = item;
          return rv;
        },
        formMapping: {
          desc: 'MTL_SYSTEM_ITEMS_DESCRIPTION_0'
        }
        //listMapping: {
        //    //desc: 'MTL_SYSTEM_ITEMS_DESCRIPTION_MIR_0',
        //    desc: 'MTL_SYSTEM_ITEMS_DESCRIPTION_0',
        //}
      };
      var saveSRV = {
        name: 'Inventory_Physical_Inventory_Counting',
        params: function (item) {
          var rv = Object.create($rootScope.currentUser);
          rv.TAG_COUNTS_CONTROL_PHYSICAL_INVENTORY_NAME_0 = $scope.selectedValues.count.name;
          //rv.TAG_COUNTS_ITEM_0 = item.item;
          rv.TAG_COUNTS_TAG_NUMBER_0 = item.id;
          rv.TAG_COUNTS_ITEM_0_X1 = item.item;
          rv.TAG_COUNTS_TAG_QUANTITY_D_0 = item.tmpQty;
          return rv;
        }
      };
      var mainSrv = {
        name: 'EBS_Inv_Tag_Count_Main',
        params: function () {
          var rv = Object.create($rootScope.currentUser);
          rv.TAG_COUNTS_CONTROL_PHYSICAL_INVENTORY_NAME_0 = $scope.selectedValues.count.name;
          return rv;
        },
        listMapping: {
          id: 'TAG_COUNTS_TAG_NUMBER_0',
          sub: 'TAG_COUNTS_SUBINVENTORY_0',
          location: 'TAG_COUNTS_LOCATOR_0',
          item: 'TAG_COUNTS_ITEM_0',
          lot: 'TAG_COUNTS_LOT_NUMBER_0',
          UOM: 'TAG_COUNTS_TAG_UOM_D_0',
          qty: 'TAG_COUNTS_TAG_QUANTITY_D_0',
          //filter: function (obj) {
          //    if (obj.TAG_COUNTS_TAG_NUMBER_0 == "") return;
          //    else return JSON.stringify(obj);
          //},
          init: function () {
            var currObj = this;
            currObj.isFinished = false;
            currObj.qty = parseInt(currObj.qty);
            currObj.tmpQty = 0;
            apWebService.runService(itemDescSrv, currObj.item).then(function (data) {
              if (data !== undefined) {
                currObj.itemDesc = data.Form.desc;
                $scope.$apply();
              }
            });
          }
        },
        formMapping: {
          defaultCounter: 'TAG_COUNTS_CONTROL_DEFAULT_EMPLOYEE_NAME_0'
        }
      };

      apWebService.runService(countNameSrv).then(function (data) {
        $scope.tagCountNames = data.List;
        $scope.$apply();
      });
      /*apWebService.runService(UOMSrv).then(function (data) {
        $scope.UOMLOV = data.List;
      });*/
      $scope.countSelect = function (countName) {
        console.log(countName);
        $scope.selectedValues.count = countName;
        $scope.countSelected = true;
        apWebService.runService(mainSrv).then(function (data) {
          $scope.mainItemsList = data.List;
          $scope.selectedValues.defaultCounter = data.Form.defaultCounter;
          $scope.applyFilter();
          $scope.$apply();
        });
      };
      $scope.countReselect = function (countName) {
        $scope.countSelected = false;
        $scope.selectedValues.defaultCounter = '';
      };
      //$scope.countNameChanged = function () {
      //    console.log($scope.tagCountNames[$scope.tagCountIndex]);
      //    $scope.selectedValues.count = $scope.tagCountNames[$scope.selectedValues.countId];
      //    apWebService.runService(mainSrv).then(function (data) {
      //        $scope.mainItemsList = data.List;
      //        $scope.selectedValues.defaultCounter = data.Form.defaultCounter;
      //        $scope.applyFilter();
      //        $scope.$apply();
      //    });
      //    //apWebService.runService(employeesSrv).then(function (data) {
      //    //    $scope.employees = data.List;
      //    //    $scope.$apply();
      //    //});
      //};
      $scope.countConfirm = function () {
        $scope.selectionScreen = false;
      };
      $scope.applyFilter = function () {
        $scope.filteredItems = $filter('filter')($scope.mainItemsList, {item: $scope.selectedValues.item}, false);
        $scope.filteredItems = $filter('orderBy')($scope.filteredItems, ['isFinished', 'id']);
        if ($scope.filteredItems.length == 1) {
          $scope.currentItem = $scope.filteredItems[0];
          $scope.selectedValues.selectedIndex = 0;
        } else {
          $scope.currentItem = {};
          $scope.selectedValues.selectedIndex = -1;
        }
      };
      $scope.itemClick = function (item, index) {
        if ($scope.currentItem !== item) {
          $scope.currentItem = item;
          $scope.selectedValues.selectedIndex = index;
          //$scope.currentItem.tmpQty = $scope.currentItem.qty;
        } else {
          $scope.clearSelectedItem();
        }
        //$scope.popover.show();
      };
      $scope.clearSelectedItem = function () {
        if ($scope.currentItem !== {}) {
          $scope.currentItem = {};
          $scope.applyFilter();
          $scope.selectedValues.selectedIndex = -1;
          $timeout(function () {
            $scope.$apply();
          }, 0);
        }
      };
      $scope.itemSave = function () {
        if ($scope.currentItem.tmpQty !== undefined && $scope.currentItem.tmpQty != $scope.currentItem.qty) {
          //save the data
          apWebService.runService(saveSRV, $scope.currentItem).then(function (data) {
            $scope.currentItem.qty = $scope.currentItem.tmpQty;
            $scope.currentItem.isFinished = true;
            $scope.clearSelectedItem();
          }, function (data) {
            alert(data.Error);
          });
        } else {
          $scope.currentItem.isFinished = true;
          $scope.clearSelectedItem();
        }
        $scope.selectedValues.item = '';
      };
      var holding = true;
      $scope.adjustQty = function (addQ, delay) {
        if (delay === undefined) delay = 500;
        holding = addQ != 0;
        $scope.currentItem.tmpQty += addQ;
        $timeout(function () {
          if (holding == true) {
            $scope.adjustQty(addQ, 200);
          }
        }, delay);
      }
    });

  })

  .controller('OnHandCtrl', function ($scope, apWebService) {
    $scope.$on('$ionicView.enter', function (e) {
      $scope.navTitle = 'OnHand Search';
    });

  })

  .controller('OnHandOldCtrl', function ($scope, $http, $stateParams, $rootScope, apWebService) {
    $scope.$on('$ionicView.enter', function (e) {
      var orgListSrv = {
        name: 'Purchasing_Organization_list',
        params: function () {
          return Object.create($rootScope.currentUser);
        },
        listMapping: {
          init: function () {
            var sArray = this.SIC_FIND_DELIVER_ORG_QP.split(',');
            this.Id = sArray[0];
            this.Name = sArray[1] == '' ? sArray[0] : sArray[1];
          }
          //id: 'FIND_CATALOG_OPERATING_UNIT_0', name: 'SIC_FIND_DELIVER_ORG_QP'
        }
      };
      //var locListSrv = {
      //    name: 'inventory_receiving_locations_list',
      //    params: function () {
      //        var rv = Object.create($rootScope.currentUser);
      //        //rv.Organizations = '';
      //        //rv.Locations = '';
      //        return rv;
      //    },
      //    listMapping: {
      //        init: function () {
      //            var sArray = this.FIND_RECEIVING_LOC_FOR_RECEIPT.split(',');
      //            this.Id = sArray[0];
      //            this.Name = sArray[1]==''?sArray[0]:sArray[1];
      //        },
      //        //id: 'FIND_OPERATING_UNIT_0',
      //        //name: 'FIND_RECEIVING_LOC_FOR_RECEIPT'
      //    }
      //};
      //var itemListSrv = {
      //    name: 'Inventory_items_list',
      //    params: function () {
      //        return Object.create($rootScope.currentUser)
      //    }
      //};
      var lotListSrv = {
        name: 'Inventory_Lot_list',
        params: function () {
          return Object.create($rootScope.currentUser);
        },
        listMapping: {
          id: 'LOT_FROM_LOV', name: 'LOT_FROM_LOV'
        }
      };
      var subinventoryListSrv = {
        name: 'Inventory_SubInventories_List',
        params: function () {
          return Object.create($rootScope.currentUser);
        },
        listMapping: {
          init: function () {
            var sArray = this.SUBINV_QF.split(',');
            this.Id = sArray[0];
            this.Name = sArray[1] == '' ? sArray[0] : sArray[1];
          }
        }
      };
      var projectListSrv = {
        name: 'inventory_projects_list',
        params: function () {
          return Object.create($rootScope.currentUser);
        },
        listMapping: {
          init: function () {
            var sArray = this.FIND_PROJECT_NUM.split(',');
            this.Id = sArray[0];
            this.Name = sArray[2] == '' ? sArray[0] : sArray[2];
          }
        }
      };
      var itemSearchSrv = {
        name: 'EBS_SearchItems_getList',
        params: function () {
          var rv = Object.create($rootScope.currentUser);
          rv.Organizations = $scope.OnHandCurrentValue.organization;
          //rv.SEARCH_CRITERIA_ITEM_0 = '';
          //rv.SEARCH_CRITERIA_ITEM_DESCRIPTION_0 = '';
          //rv.SEARCH_CRITERIA_ITEM_STATUS_DSP_0 = '';
          return rv;
        },
        listMapping: {
          name: 'MATCHING_ITEMS_INV_ITEM_0',
          qty: 'MATCHING_ITEMS_QTY_ON_HAND_0',
          desc: 'MATCHING_ITEMS_DESCRIPTION_0',
          uom: 'MATCHING_ITEMS_PRIMARY_UOM_CODE_0'
        }
      };

      $scope.SearchTextBox = "";
      $scope.navTitle = $rootScope.MainTitle;

      $scope.OnHandCurrentValue =
      {
        organization: "",
        loaction: "",
        currentItem: ""
      };

      apWebService.runService(orgListSrv).then(function (data) {
        $scope.Org = data.List;
        $scope.OnHandCurrentValue.organization = $scope.Org[0].Id;
        $scope.orgChange();
      });
      //$scope.Org = $rootScope.listOfClients;
      //$rootScope.OnHandCurrentValue.organization = $scope.Org[0].Id;

      //$http.get($rootScope.hostName + "ServiceManager/Macro/ExecMacro/purchasing_organization_list?json=true&username=OPERATIONS&password=welcome").success(function (data) {
      //    $scope.details = $rootScope.details;
      //}).error(function (data) {
      //    alert("Error : " + data);
      //});

      //$scope.navigatePage = function (Path, Num) {
      //    window.location.href = Path + String(Num);
      //}

      // clients filter
      $scope.orgChange = function () {
        apWebService.runService(itemSearchSrv).then(function (data) {
          $scope.ItemsArray = data.List;
        });
        //apWebService.runService(locListSrv).then(function (data) {
        //    $scope.LocationArray = data.List;
        //    $rootScope.OnHandCurrentValue.loaction = $scope.LocationArray[0].Id;
        //});
        //$http.get($rootScope.hostName + "ServiceManager/Macro/ExecMacro/EBS_SearchItems_getList?json=true&username=OPERATIONS&password=welcome&Organizations=" + $rootScope.OnHandCurrentValue.organization).success(function (data) {
        //    $scope.ItemsArray = [];
        //    var Items = data.Response.EBS_SearchItems_getListTableArray.EBS_SearchItems_getListArrayItem;
        //    console.log(Items)
        //    for (i in Items) {
        //        if (Items[i].MATCHING_ITEMS_DESCRIPTION_0 !== undefined) {
        //            $scope.ItemsArray.push({
        //                name: Items[i].MATCHING_ITEMS_INV_ITEM_0
        //            });
        //        }
        //    }
        //}).error(function (data) {
        //    alert("Error : " + data);
        //});
      };

      //$scope.orgChange();
      $scope.hideBar = false;
      $scope.data = {"search": ''};

      $scope.search = function () {
        $scope.hideBar = $scope.data.search.length != 0;
      };

      //$http.get($rootScope.hostName + "ServiceManager/Macro/ExecMacro/Inventory_Receiving_Locations_list?json=true&SIGNON_USERNAME_0=OPERATIONS&SIGNON_PASSWORD_0=welcome").success(function (data) {
      //    $scope.LocationArray = [];
      //    console.log(data)
      //    var locationSrc = data.Response.Inventory_Receiving_Locations_listTableArray.Inventory_Receiving_Locations_listArrayItem;
      //    console.log(locationSrc)
      //    for (i in locationSrc) {
      //        if (locationSrc[i].FIND_RECEIVING_LOC_FOR_RECEIPT !== undefined) {
      //            $scope.LocationArray.push({
      //                Id: locationSrc[i].FIND_OPERATING_UNIT_0
      //                , Name: locationSrc[i].FIND_RECEIVING_LOC_FOR_RECEIPT
      //            });
      //        }
      //    }

      //    $rootScope.OnHandCurrentValue.loaction = $scope.LocationArray[0].Id;
      //    console.log("Login12 : ")
      //    console.log($scope.LocationArray)

      //}).error(function (data) {
      //    alert("Error : " + data);
      //});
    });

    $scope.showInfo = function () {
      alert("Show : " + $rootScope.OnHandCurrentValue.loaction)
    };


  })


  .controller('OnHandSearchCtrl', function ($scope, $http, $stateParams, $rootScope) {
    $scope.$on('$ionicView.enter', function (e) {
      $scope.navTitle = $rootSocpe.MainTitle;
      $scope.details = $rootScope.details;
      $rootScope.OnHandCurrentValue.currentItem = $stateParams.id;


      $http.get('js/json/search.json').success(function (data) {
        console.log(data);
        $scope.SearchResaults = data;
      }).error(function (data) {
        alert("Error : " + data);
      });


      $scope.navigatePage = function (Path, Num) {
        window.location.href = Path + String(Num);
      };
      /*
       * if given group is the selected group, deselect it
       * else, select the given group
       */
      $scope.toggleGroup = function (group) {
        if ($scope.isGroupShown(group)) {
          $scope.shownGroup = null;
        } else {
          $scope.shownGroup = group;
        }
      };
      $scope.isGroupShown = function (group) {
        return $scope.shownGroup === group;
      };

      //http://ec2-54-184-135-202.us-west-2.compute.amazonaws.com:8080/ServiceManager/www/ebs/
      //http://52.25.115.99:8080/ServiceManager/Macro/ExecMacro/EBS_onHandAvailability_search?json=true&username=OPERATIONS&password=welcome&Organizations=B1&item=Laptop%20Computers
      //http://52.25.115.99:8080/ServiceManager/Macro/ExecMacro/EBS_onHandAvailability_search?json=true&username=OPERATIONS&password=welcome&Organizations=B2&item=AS66311
      console.log($rootScope.hostName + "ServiceManager/Macro/ExecMacro/EBS_onHandAvailability_search?json=true&username=OPERATIONS&password=welcome&Organizations=" + $rootScope.OnHandCurrentValue.organization + "&item=" + $rootScope.OnHandCurrentValue.currentItem);
      $http.get($rootScope.hostName + "ServiceManager/Macro/ExecMacro/EBS_onHandAvailability_search?json=true&username=OPERATIONS&password=welcome&Organizations=" + $rootScope.OnHandCurrentValue.organization + "&item=" + $rootScope.OnHandCurrentValue.currentItem).success(function (data) {

        /* $scope.groups[i].items.push({Org:AVAILABILITY_ORGANIZATION_CODE_0})
         $scope.groups[i].items.push(Sub:AVAILABILITY_SUBINVENTORY_CODE_0})
         /*  Org:AVAILABILITY_ORGANIZATION_CODE_0,
         Sub:AVAILABILITY_SUBINVENTORY_CODE_0,
         Locator:AVAILABILITY_LOCATOR_0,
         Lot:AVAILABILITY_LOT_NUMBER_0,
         Total:AVAILABILITY_TOTAL_QUANTITY_0,
         UOM:AVAILABILITY_PRIMARY_UOM_CODE_0,
         Status:sss*/

        $scope.AvailebleItems = data.Response.EBS_onHandAvailability_searchElements;
        console.log($scope.AvailebleItems);
        $scope.AvailebleArray = [$scope.AvailebleItems, $scope.AvailebleItems, $scope.AvailebleItems];
        $scope.groups = [];
        for (var i = 0; i < 3; i++) {
          $scope.groups[i] = {
            name: $scope.AvailebleArray[i].AVAILABILITY_ITEM_0,
            items: []
          };
          for (var j = 0; j < 1; j++) {
            $scope.groups[i].items.push(i + '1-1' + j);
          }
        }


      }).error(function (data) {
        alert("Error : " + data);
      });

    });
  })


  .controller('OnHandResaultCtrl', function ($scope) {
    $scope.$on('$ionicView.enter', function (e) {
      //$scope.navTitle = '<a href="#/app/main"><img class="title-image" src="http://i.imgur.com/HKbtyqR.png"  /></a>'

    })
  })


  .controller('SearchItem', function ($scope) {
    $scope.$on('$ionicView.enter', function (e) {
      var SearchText = "ccc"; //$stateParams.id;


    })
  });


/*
 var SearchText = ""; //$stateParams.id;
 $http.get($rootScope.hostName+"ServiceManager/Macro/ExecMacro/EBS_MasterItemSearchList?json=true&username=OPERATIONS&password=welcome&Organizations="+$rootScope.OnHandCurrentValue.organization+"&Items="+$stateParams.id).success(function(data)
 {

 $scope.ItemsArray = [];
 var Items = data.Response.EBS_MasterItemSearchListTableArray.EBS_MasterItemSearchListArrayItem;

 for (i in Items) {
 if (Items[i].MTL_SYSTEM_ITEMS_DESCRIPTION_0 !== undefined){
 $scope.ItemsArray.push({
 description:Items[i].MTL_SYSTEM_ITEMS_DESCRIPTION_0,
 name:Items[i].MTL_SYSTEM_ITEMS_INVENTORY_ITEM_0,
 code:Items[i].MTL_SYSTEM_ITEMS_INVENTORY_ITEM_STATUS_CODE_0,
 unit_of_measure:Items[i].MTL_SYSTEM_ITEMS_PRIMARY_UNIT_OF_MEASURE_0,
 });
 }
 }

 console.log("ItemsSS")
 console.log($scope.ItemsArray)
 }).error(function(data)
 {
 alert("Error : " + data);
 });

 */
