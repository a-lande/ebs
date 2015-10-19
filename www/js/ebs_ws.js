(function () {
  'use strict';

  var ebsWebServices = angular.module('ebs.ws', ['ap.services']);
  ebsWebServices.service('ebsWS', ['$rootScope', function ($rootScope) {

    this.locationListSrv = {
      name: 'Inventory_Receiving_Locations_list',
      params: $rootScope.currentUser,
      listMapping: {
        init: function () {
          var sArray = this.FIND_RECEIVING_LOC_FOR_RECEIPT.split(',');
          this.key = sArray[0];
          this.name = sArray[1];
        }
      },
      cache: true
    };

    this.SubInvListSrv = {
      name: 'Inventory_SubInventories_List',
      params: $rootScope.currentUser,
      listMapping: {
        init: function () {
          var sArray = this.SUBINV_QF.split(',');
          this.key = sArray[0];
          this.name = sArray[1];
        }
      },
      cache: true
    };

    this.ProjectListSrv = {
      name: 'Inventory_Projects_list',
      params: $rootScope.currentUser,
      listMapping: {
        init: function () {
          var sArray = this.FIND_PROJECT_NUM.split(',');
          this.key = sArray.shift();
          sArray.shift(); // ignoring second argument
          this.name = sArray.join();
        }
      },
      cache: true
    };

    this.LotListSrv = {
      name: 'Inventory_Lot_list',
      params: $rootScope.currentUser,
      listMapping: {
        key: 'LOT_FROM_LOV',
        name: 'LOT_FROM_LOV'
      },
      cache: true
    };

    this.UOMListSrv = {
      name: 'Inventory_Primary_Unit_Of_Measure',
      params: $rootScope.currentUser,
      listMapping: {
        init: function () {
          var sArray = this.QF_PRIMARY_UOM_QP.split(',');
          this.name = sArray[0];
          this.key = sArray[1];
          this.type = sArray[2];
        }
      },
      cache: true
    }

    this.OnHandSrv = {
      name: 'OnHand',
      params: $rootScope.currentUser,
      debug: true,
      listMapping: {
        filter: function (obj) {
          return (obj.ORGANIZATION_CODE == $rootScope.org.Id);
        }
      }
    };

    this.OnHandQntSrv = function (item, subInv, lot) {
      var s = (subInv && subInv != '');
      var l = (lot && lot != '');
      var srv = {
        params: Object.create($rootScope.currentUser),
        formMapping: {
          priQty: "AVAILABILITY_TOTAL_QUANTITY_0",
          priUOM: "AVAILABILITY_PRIMARY_UOM_CODE_0",
          priATR: "AVAILABILITY_ATR_0",
          priATT: "AVAILABILITY_ATT_0",
          secQty: "AVAILABILITY_SECONDARY_ONHAND_0",
          secUOM: "AVAILABILITY_SECONDARY_UOM_CODE_0",
          secATR: "AVAILABILITY_SATR_0",
          secATT: "AVAILABILITY_SATT_0",
        }
      };
      // deciding which service to call
      if (!s && !l) srv.name = 'Inventory_Onhand_Quantity';
      if (s && !l) srv.name = 'Inventory_Onhand_Quantity_by_Subinventory';
      if (!s && l) srv.name = 'Inventory_Onhand_Quantity_by_Lot';
      if (s && l) srv.name = '';
      // assigning paramaters
      srv.params.MATERIAL_QF_ITEM_0 = item;
      if (s) srv.params.MATERIAL_QF_SUBINVENTORY_CODE_0 = subInv;
      if (l) srv.params.MATERIAL_QF_LOT_FROM_0 = lot;
      return srv;
    };

  }]);
})();
