const app = SUGAR.App;
const customization = require('%app.core%/customization.js');
const dialog = require('%app.core%/dialog');
const DetailView = require('%app.views.detail%/detail-view');
const geolocation = require('%app.core%/geolocation');

const AccountDetailView = customization.extend(DetailView, {

    initialize(options) {
        this._super(options); 

    },

    onAfterShow(){
          self=this;
          app.alert.show('getAdeudos', {
              level: 'load',
              closeable: false,
              messages: 'Cargando...',
            });
          app.api.call('GET', app.api.buildURL('Accounts/'+this.model.get('id')+'/link/quotes'), null, {

            success:function(data){
              app.alert.dismiss('getAdeudos');
                var suma=0;
                var cont_adeudos=0;
                var registros=data.records.length;
                var adeudos_mensaje="";

                if(registros>0){
                    for (var i = 0; i < data.records.length; i++) {

                        if(data.records[i].quote_stage=="On Hold" && data.records[i].total >0){
                            cont_adeudos+=1;
                            suma+=parseFloat(data.records[i].total);
                            adeudos_mensaje+="Orden: "+data.records[i].name+ ", Monto: $"+parseFloat(data.records[i].total).toFixed(2)+"\n";
                        }

                    }
                    var mensaje="El cliente tiene un adeudo de $"+parseFloat(suma).toFixed(2)+" en "+cont_adeudos+" orden(es)\nLos montos son:\n"+adeudos_mensaje;
                    if(suma>0){
                        self.model.set({
                          pending_note_c:mensaje
                        }, { silent: true });

                        self.model.save({}, {
                          // Pass a list of fields to be sent to the server
                              fields: [
                                'pending_note_c',
                              ],
                              complete: () => {
                                dialog.showAlert(mensaje);
                              }
                          });

                    }else{
                        self.model.set({
                          pending_note_c:mensaje
                        }, { silent: true });
                    }
                }

            },
            error:function (e) {
                console.log(e);
            }

          });
        
    }
 
});


customization.register(AccountDetailView,{module: 'Accounts'});

module.exports = AccountDetailView;

