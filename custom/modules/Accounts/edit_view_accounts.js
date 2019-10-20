const app = SUGAR.App;
const customization = require('%app.core%/customization.js');
const dialog = require('%app.core%/dialog');
const EditView = require('%app.views.edit%/edit-view');
const geolocation = require('%app.core%/geolocation');

const AccountEditView = customization.extend(EditView, {

    initialize(options) {
        this._super(options);    
    },

    onAfterShow(){

        self = this;
        if(this.model.get('gps_latitud_c') == undefined || this.model.get('gps_latitud_c')==''){

            app.alert.show('getLatLng', {level: 'process',title: 'Obteniendo Ubicación...'});

            geolocation.getCurrentPosition({
              successCb: (position) => {
                app.alert.dismiss('getLatLng');
                self.model.set({
                  gps_latitud_c:  position.coords.latitude,
                  gps_longitud_c: position.coords.longitude,
                }, { silent: true });
                self.model.save({
                    //check_in_address_c: address,
                }, {
                    // Pass a list of fields to be sent to the server
                    fields: [
                      'gps_latitud_c',
                      'gps_longitud_c',
                    ],
                    complete: () => {
                        // Close the alert when save operation completes
                    }
                });
              },
              errorCb: (errCode, errMessage) => {
                app.alert.dismiss('getLatLng');
                app.logger.debug(`Ubicación no disponible: ${errCode} - ${errMessage}`);
                dialog.showAlert(errMessage);
              },
              enableHighAccuracy: false,
              timeout: 300000,
            });
        }   
    },
 
    _render: function () {
       this._super("_render");

   },

});


customization.register(AccountEditView,{module: 'Accounts'});

module.exports = AccountEditView;

