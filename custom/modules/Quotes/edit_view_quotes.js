
const app = SUGAR.App;
const customization = require('%app.core%/customization.js');
const dialog = require('%app.core%/dialog');
//const QuotesEditView = require('%app.views.edit%/modules/quotes-edit-view');
const QuotesEditView = require('%app.views.edit%/modules/quotes-edit-container-view.js');;
const geolocation = require('%app.core%/geolocation');

const CustomQuoteEditView = customization.extend(QuotesEditView, {

    initialize(options) {
        this._super(options);    
    },

    onAfterShow(){

        self = this;
        if(this.model.get('gps_latitud_c') == undefined || this.model.get('gps_latitud_c')==''){

            app.alert.show('getLatLng', {
              level: 'load',
              closeable: false,
              messages: 'Cargando, por favor espere',
            });

            geolocation.getCurrentPosition({
              successCb: (position) => {
                app.alert.dismiss('getLatLng');
                self.model.set({
                  gps_latitud_c:  position.coords.latitude,
                  gps_longitud_c: position.coords.longitude,
                }, { silent: true });
                /*
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
                */
              },
              errorCb: (errCode, errMessage) => {
                app.alert.dismiss('getLatLng');
                app.alert.show('getLatLngError', {
                  level: 'error',
                  autoClose: true,
                messages: 'No se ha podido obtener la ubicación',
                });
                
              },
              enableHighAccuracy: false,
              timeout: 300000,
            });
        }   
    },
});
    

customization.register(CustomQuoteEditView,{module: 'Quotes'});

module.exports = CustomQuoteEditView;


