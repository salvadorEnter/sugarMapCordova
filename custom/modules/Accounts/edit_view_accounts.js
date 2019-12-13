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

                //Llamar a api para obtener dirección a partir de lat y long
                var lat=position.coords.latitude;
                var lng=position.coords.longitude;
                var urlGeocode='https://maps.googleapis.com/maps/api/geocode/json?latlng='+lat+','+lng+'&key=AIzaSyCVh5NcPi98UVoKI6wTVpiVBDZOht4rltc';
                $.get(urlGeocode, function(data, status){
                  if(status=="success"){
                    if(data.results.length>0){

                      var cant_componentes=data.results[0].address_components.length;
                      if(cant_componentes>0){
                        var calle='';
                        var ciudad='';
                        var estado='';
                        var pais='';
                        var cp='';

                        for (var i = 0; i < cant_componentes ; i++) {

                          //Armando call
                          if(data.results[0].address_components[i].types.includes('premise')){
                            calle+=data.results[0].address_components[i].long_name;
                          }
                          if(data.results[0].address_components[i].types.includes('route')){
                            calle+=' '+data.results[0].address_components[i].long_name;
                          }
                          if(data.results[0].address_components[i].types.includes('street_number')){
                            calle+=' '+data.results[0].address_components[i].long_name;
                          }

                          //Armando ciudad
                          if(data.results[0].address_components[i].types.includes('locality')){
                            ciudad+=data.results[0].address_components[i].long_name;
                          }

                          //Armando estado
                          if(data.results[0].address_components[i].types.includes('administrative_area_level_1')){
                            estado+=data.results[0].address_components[i].long_name;
                          }

                          //Armando pais
                          if(data.results[0].address_components[i].types.includes('country')){
                            pais+=data.results[0].address_components[i].long_name;
                          }

                          //Armando pais
                          if(data.results[0].address_components[i].types.includes('postal_code')){
                            cp+=data.results[0].address_components[i].long_name;
                          }

                        }//end for

                        self.model.set({
                          billing_address_street: calle,
                          billing_address_city: ciudad,
                          billing_address_state: estado,
                          billing_address_country: pais,
                          billing_address_postalcode: cp,
                          }, { silent: true });

                      }
                    }

                  }
                });
                
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


customization.register(AccountEditView,{module: 'Accounts'});

module.exports = AccountEditView;

