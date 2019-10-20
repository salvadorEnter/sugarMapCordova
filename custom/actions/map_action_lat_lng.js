const customization = require('%app.core%/customization');
const device = require('%app.core%/device');
const dialog = require('%app.core%/dialog');

customization.registerRecordAction({
    modules: ['Accounts'],
    name: 'map',
    types: ['context-menu', 'toolbar'],
    label: 'Mapa',

    // The icon must be defined in config/app.json
    iconKey: 'actions.map',
    rank: 2,

    // Customize action button state.
    stateHandlers: {
        isEnabled(view, model) {
            // Implement: for example, check if the record has enough
            // information to make a skype call.
            return true;
        },
    },

    handler(view, model) {

    	var calle=model.get('billing_address_street');
    	var ciudad=model.get('billing_address_city');
    	var estado=model.get('billing_address_state');
    	var cp=model.get('billing_address_postalcode');
    	var pais=model.get('billing_address_country');

    	var lat=model.get('gps_latitud_c');
    	var lng=model.get('gps_longitud_c');

    	if(lat != null && lat != "" && lng !=null && lng != ""){
    		device.openAddress({
    			location: {
    				latitude: lat,
    				longitude: lng,
        		},
        		showDirections: true,
      		});
    	}else if(calle != null && calle != "" && ciudad !=null && ciudad != "" &&
    		estado != null && estado != "" && cp != null && cp != ""){

    		device.openAddress({ 
    			addresses:[
    				{'Billing Address': 
    					{
    						street: calle, city: ciudad,
    						state: estado, postalcode: cp 
    					}
    				},
				]
			});
    	}else{

    		dialog.showAlert('Sin datos de dirección, favor de registrar Latitud y Longitud o Dirección de facturación', {
    			title: 'Sin datos',
    			buttonLabels: 'Aceptar'
    		});
    	}        
    },//handler
});