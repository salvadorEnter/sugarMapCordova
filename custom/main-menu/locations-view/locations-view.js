const customization = require('%app.core%/customization');
const device = require('%app.core%/device');
const dialog = require('%app.core%/dialog');
const NomadView = require('%app.views%/nomad-view');
const geolocation = require('%app.core%/geolocation');
const FilteredListView = require('%app.views.list%/filtered-list-view');

customization.registerMainMenuItem({
    label: 'Consultar ubicaciones',

    iconKey: 'actions.location-view',
    rank: 0,
    route:'locations_view'
});

// Registrando nueva ruta citas_edit
customization.registerRoutes([{
    name: 'locations',      // Uniquely identifies the route
    steps: 'locations_view',     // Route hash fragment: '#hello'

    handler(options) {
        app.controller.loadScreen({
            isDynamic: true,
            view: LocationsView,
        });
    }
}]);

//Definición de nueva vista para edición de Ubicaciones
let LocationsView = customization.extend(NomadView, {
    // Se especifica el nombre del template
    template: 'locations-view',

    defCuentas: null,

    currentLatitud:null,
    currentLng:null,

    // Configure the header
    headerConfig: {
        title: 'Ubicaciones',
        buttons: {
            //save: {label: 'Listo'},
            /*cancel: {label: 'Regresar'},*/
            mainMenu: true
        },
    },

    //Definición de eventos
    events: {
        'click #linkCuenta': 'navigateCuenta',
        'click .tablinks':'openTab',
        'click .buttonRound':'openViewFilter',
        'click .closebtn':'closeNav',
        'change #available_fields':'onChangeFiltro',
        'click .deleteField':'removerFiltro',
        'change .operador':'setFieldValue',
        'click #fireSearch':'fireSearch',
    },

    initialize(options) {
        self = this;
        this._super(options);
        this.defCuentas=[];
        this.getCuentas();
        this.obtenerUbicacion();
        this.campos_disponibles=[{'nombre':'','etiqueta':''}];
        //Cargando el mapeo de opciones que se deben de cargar dependiendo al tipo de campo seleccionado
        this.loadFilterOperators();
        this._operatorsWithNoValues = ['$empty', '$not_empty'];
        //Llenando dropdown con los campos disponibles para filtrar del módulo de Cuentas
        this.campos=this.getFilterFields('Accounts');

        for (var key in this.campos){
            if(this.campos[key].type != undefined && this.campos[key].type != 'relate'){
                var opcion={
                    'nombre':this.campos[key].name,
                    'etiqueta':app.lang.get(this.campos[key].vname, 'Accounts')
                };
                this.campos_disponibles.push(opcion);
            }
        }
    },

    getCuentas(){

        self=this;

        var params = {
            'fields':'id,name,quick_contact_c,business_type_c,account_type,assigned_user_id,assigned_user_name,gps_latitud_c,gps_longitud_c,visit_status_c,estrellas_c,photography_c',
            'order_by':'date_modified:DESC',
            'max_num':-1
        };

        var url = app.api.buildURL("GetAccountsForMap", '', {}, {});

        app.alert.show('accounts_load', {
            level: 'load',
            closeable: false,
            messages: app.lang.get('LBL_LOADING'),
        });

        app.api.call("read", url, null, {
            success: data => {

                self.defCuentas=data.records;
                var contextoApiCuentas=this;
                    //Se establece height dinámicamente, con base a la altura de la ventana
                    document.getElementById("map").setAttribute("style", "width: 100%;height: " + window.screen.height+'px');
                    var mapDiv = document.getElementById("map");

                    var map=plugin.google.maps.Map.getMap(mapDiv,{
                        'camera': {
                            'zoom': 7
                        }
                    });

                    if(data.records.length>0){

                        //Inicializando infowindow
                        var infowindow = new plugin.google.maps.HtmlInfoWindow();

                        // Add markers
                        var bounds = [];
                        for(var i=0;i<data.records.length;i++){

                            if(data.records[i].gps_latitud_c !="" && data.records[i].gps_longitud_c != ""){

                               var icono='';
                               switch(data.records[i].visit_c){

                                case "Planned":
                                icono = "img/icon-negro_.png";
                                break;

                                case "Done":
                                icono = "img/icon-verde_.png";
                                break;

                                case "Rescheduled":
                                icono = "img/icon-azul_.png";
                                break;
                                case "Canceled":
                                icono = "img/icon-rojo_.png";
                                break;
                                case "Pending":
                                icono = "img/icon-amarillo_.png";
                                break;

                                case "":
                                icono = "img/icon-negro_.png";
                                break;

                                default:
                                icono = "img/icon-negro_.png";
                                }//switch
                                
                                bounds.push({"lat":data.records[i].gps_latitud_c,"lng":data.records[i].gps_longitud_c});

                                var marker = map.addMarker({
                                    'position': {"lat":data.records[i].gps_latitud_c,"lng":data.records[i].gps_longitud_c},
                                    'title': data.records[i].id,
                                    'icon': {
                                        'url': icono
                                    }
                                });

                                marker.on(plugin.google.maps.event.INFO_CLICK, function() {
                                    // Hide the infoWindow
                                    marker.hideInfoWindow();
                                });

                                marker.on(plugin.google.maps.event.MARKER_CLICK, function(markers, info) {

                                    //document.getElementById("map").setAttribute("style", "width: 100%;height: 400px");
                                    document.getElementById("map").setAttribute("style", "width: 100%;height: " + window.screen.height+'px');
                                    var idCuenta=info.getOptions().title;
                                    var definicionCuenta=self.search(idCuenta, self.defCuentas);
                                    var urlImage='';
                                    if(definicionCuenta.photography_c != "" && definicionCuenta.photography_c !=null){
                                        urlImage=self.generarURLImage('Accounts', definicionCuenta.id, 'photography_c',definicionCuenta.photography_c);

                                        //$('#imageSection').html('<img style="float: left; margin: 0px 15px 15px 0px;" src="'+urlImage+'" width="40%">');
                                    }else{
                                        //$('#imageSection').html('<img style="float: left; margin: 0px 15px 15px 0px;" src="img/defaultImageMap.png" width="40%">');
                                        urlImage='img/sugar_crm_icon.png';
                                    }

                                    var domicilio='';
                                    if(definicionCuenta.calle != null && definicionCuenta.calle != "" && definicionCuenta.calle !=undefined &&
                                        definicionCuenta.ciudad !=null && definicionCuenta.ciudad != "" && definicionCuenta.ciudad !=undefined){
                                        domicilio='<b> '+definicionCuenta.calle+', '+definicionCuenta.ciudad+'<br>'+
                                    definicionCuenta.estado+' ' +definicionCuenta.cp +'<br>'+
                                    definicionCuenta.pais+'</b>';
                                }
                                var contenido='<p>Nombre del negocio: <input type = "hidden" value="'+definicionCuenta.id+'"><font id="linkCuenta" color="#0679c8">'+definicionCuenta.name+'</font></p>'+
                                '<p>Contacto rápido: <b> '+definicionCuenta.quick_contact_c+'</b></p>'+
                                '<p>Tipo de negocio: <b> '+App.lang.getAppListStrings('business_type_list')[definicionCuenta.business_type_c]+'</b></p>'+
                                '<p>Tipo: <b> '+App.lang.getAppListStrings('account_type_dom')[definicionCuenta.account_type]+'</b></p>'+
                                '<p>Domicilio: '+domicilio+'</p>';

                                    //$('#nameStars').children('div').eq(0).html('<h1>'+definicionCuenta.name+'<h1>');

                                    var contenidoUsuario='<p>Usuario: <a href="#Users/'+definicionCuenta.id_user+' "target="_blank">'+definicionCuenta.nombre_completo_usuario +'</a></p>'+
                                    '<p>Nombre de Usuario: <b>'+definicionCuenta.nombre_usuario +'</b></p>'+
                                    '<p>Departamento: <b>'+definicionCuenta.depto +'</b></p>'+
                                    '<p>Informa a: <a href="#Users/'+definicionCuenta.reporta_id+' "target="_blank">'+definicionCuenta.reporta +'</a></p>';

                                    //Llenando sección con las estrellas
                                    var estrellas=definicionCuenta.rate_c;
                                    var contenidoEstrellas='';
                                    if(estrellas=="" || estrellas ==0 || estrellas ==null){
                                        contenidoEstrellas='<img style="" src="img/0_estrellas.png" width="100">';
                                        //$('#star_container').html(contenidoEstrellas);
                                    }else{

                                        contenidoEstrellas='<img style="" src="img/'+estrellas+'_estrellas.png" width="100">';

                                        //$('#star_container').html(contenidoEstrellas);
                                    }

                                    var contenidoInfoWindow='<div class="tab" style="width: 330px;border-bottom: 1px solid #ddd">'+
                                    '<button class="tablinks" style="background-color:#ffffff;color:#337ab7;border-left:1px solid #dadada;border-right:1px solid #dadada;border-top:1px solid #dadada;">Cuenta</button>'+
                                    '<button class="tablinks" style="background-color:#ffffff;color:#337ab7;">Usuario</button>'+
                                    '</div>'+
                                    '<div id="Cuenta" class="tabcontent">'+
                                    '<div id="contenidoCuenta" style="padding: 10px;">'+
                                    '<img style="float: left; margin: 0px 15px 15px 0px;" src="'+urlImage+'" width="100">'+
                                    '<p> Nombre del negocio: <a href="#Accounts/'+definicionCuenta.id+'"target="_blank"> '+definicionCuenta.name+'</a></p>'+
                                    contenidoEstrellas+
                                    '<p>Contacto rápido: <b> '+definicionCuenta.quick_contact_c+'</b></p>'+
                                    '<p>Tipo de negocio: <b> '+App.lang.getAppListStrings('business_type_list')[definicionCuenta.business_type_c]+'</b></p>'+
                                    '<p>Tipo: <b> '+App.lang.getAppListStrings('account_type_dom')[definicionCuenta.account_type]+'</b></p>'+
                                    '<p>Domicilio:'+domicilio+'</p>'+            
                                    '</div>'+
                                    '</div>'+
                                    '<div id="Usuario" class="tabcontent" style="display:none">'+
                                    '<div id="contenidoUsuario" style="padding: 10px;">'+
                                    '<p>Usuario: <a href="#Users/'+definicionCuenta.id_user+' "target="_blank">'+definicionCuenta.nombre_completo_usuario +'</a></p>'+
                                    '<p>Nombre de Usuario: <b>'+definicionCuenta.nombre_usuario +'</b></p>'+
                                    '<p>Departamento: <b>'+definicionCuenta.depto +'</b></p>'+
                                    '<p>Informa a: <a href="#Users/'+definicionCuenta.reporta_id+'" target="_blank">'+definicionCuenta.reporta +'</a></p>'+
                                    '</div>'+
                                    '</div>';

                                    infowindow.setContent(contenidoInfoWindow);
                                    infowindow.open(this);

                                });
                            }//if lat lng
                        }//for

                        // Set a camera position that includes all markers.
                        map.moveCamera({
                            target: bounds
                        });
                    }//if length data.records
                },//end success api call
                error: er => {
                    app.alert.show('api_carga_error', {
                        level: 'error',
                        autoClose: true,
                        messages: 'Error al cargar datos: '+er,
                    });
                },
                complete: () => {
                    app.alert.dismiss('accounts_load');
                },
            });//App.api.call
    },//end getCuentas

    obtenerUbicacion(){
        self=this;

        app.alert.show('getLatLng', {
          level: 'load',
          closeable: false,
          messages: 'Cargando, por favor espere',
      });
        geolocation.getCurrentPosition({
          successCb: (position) => {
            app.alert.dismiss('getLatLng');

            self.currentLatitud=position.coords.latitude;
            self.currentLng=position.coords.longitude;
            document.getElementById("map").setAttribute("style", "width: 100%;height: " + window.screen.height+'px');
            var mapDiv = document.getElementById("map");

            var map=plugin.google.maps.Map.getMap(mapDiv,{
                'camera': {
                    'zoom': 7
                }
            });

            var currentLocationMarker = map.addMarker({
                'position': {"lat":self.currentLatitud,"lng":self.currentLng},
                'title': 'Usted está aquí',
                'icon': {
                    'url': 'img/iconCurrentLocation.png'
                }
            });

                        // Show the infoWindow
                        currentLocationMarker.showInfoWindow();
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

    },

    loadFilterOperators:function(module="Accounts"){

        //this.filterOperatorMap = app.metadata.getFilterOperators(module);
        this.filterOperatorMap={
            "email" : [
            {"$equals" : "combinaciones exactas"},
            {"$starts" : "empieza con"}
            ],
            "text" : [
            {"$equals" : "combinaciones exactas"},
            {"$starts" : "empieza con"}
            ],
            "textarea" : [
            {"$equals" : "combinaciones exactas"},
            {"$starts" : "empieza con"}
            ],
            "currency" : [
            {"$equals" : "es igual a"},
            {"$not_equals" : "no es igual a"},
            {"$gt" : "es mayor que"},
            {"$lt" : "es menor que"},
            {"$gte" : "es mayor o igual que"},
            {"$lte" : "es menor o igual que"},
            {"$between" : "está entre"}
            ],
            "int" : [
            {"$equals" : "es igual a"},
            {"$not_equals" : "no es igual a"},
            {"$in" : "es cualquiera de"},
            {"$gt" : "es mayor que"},
            {"$lt" : "es menor que"},
            {"$gte" : "es mayor o igual que"},
            {"$lte" : "es menor o igual que"},
            {"$between" : "está entre"}
            ],
            "double" : [
            {"$equals" : "es igual a"},
            {"$not_equals" : "no es igual a"},
            {"$gt" : "es mayor que"},
            {"$lt" : "es menor que"},
            {"$gte" : "es mayor o igual que"},
            {"$lte" : "es menor o igual que"},
            {"$between" : "está entre"}
            ],
            "float" : [
            {"$equals" : "es igual a"},
            {"$not_equals" : "no es igual a"},
            {"$gt" : "es mayor que"},
            {"$lt" : "es menor que"},
            {"$gte" : "es mayor o igual que"},
            {"$lte" : "es menor o igual que"},
            {"$between" : "está entre"}
            ],
            "decimal" : [
            {"$equals" : "es igual a"},
            {"$not_equals" : "no es igual a"},
            {"$gt" : "es mayor que"},
            {"$lt" : "es menor que"},
            {"$gte" : "es mayor o igual que"},
            {"$lte" : "es menor o igual que"},
            {"$between" : "está entre"},
            ],
            "date" : [
            {"$equals" : "es igual a"},
            {"$lt" : "antes"},
            {"$gt" : "después"},
            {"yesterday" : "ayer"},
            {"today" : "hoy"},
            {"tomorrow" : "mañana"},
            {"last_7_days" : "últimos 7 días"},
            {"next_7_days" : "próximos 7 días"},
            {"last_30_days" : "últimos 30 días"},
            {"next_30_days" : "próximos 30 días"},
            {"last_month" : "último mes"},
            {"this_month" : "este mes"},
            {"next_month" : "próximo mes"},
            {"last_year" : "último año"},
            {"this_year" : "este año"},
            {"next_year" : "próximo año"},
            {"$dateBetween" : "está entre"},
            ],
            "datetime" : [
            {"$starts" : "es igual a"},
            {"$lte" : "antes"},
            {"$gte" : "después"},
            {"yesterday" : "ayer"},
            {"today" : "hoy"},
            {"tomorrow" : "mañana"},
            {"last_7_days" : "últimos 7 días"},
            {"next_7_days" : "próximos 7 días"},
            {"last_30_days" : "últimos 30 días"},
            {"next_30_days" : "próximos 30 días"},
            {"last_month" : "último mes"},
            {"this_month" : "este mes"},
            {"next_month" : "próximo mes"},
            {"last_year" : "último año"},
            {"this_year" : "este año"},
            {"next_year" : "próximo año"},
            {"$dateBetween" : "está entre"}
            ],
            "datetimecombo" : [
            {"$starts" : "es igual a"},
            {"$lte" : "antes"},
            {"$gte" : "después"},
            {"yesterday" : "ayer"},
            {"today" : "hoy"},
            {"tomorrow" : "mañana"},
            {"last_7_days" : "últimos 7 días"},
            {"next_7_days" : "próximos 7 días"},
            {"last_30_days" : "últimos 30 días"},
            {"next_30_days" : "próximos 30 días"},
            {"last_month" : "último mes"},
            {"this_month" : "este mes"},
            {"next_month" : "próximo mes"},
            {"last_year" : "último año"},
            {"this_year" : "este año"},
            {"next_year" : "próximo año"},
            {"$dateBetween" : "está entre"},
            ],
            "bool" : [
            {"$equals" : "es"}
            ],
            "relate" : [
            {"$in" : "es cualquiera de"},
            {"$not_in" : "no es cualquiera de"},
            ],
            "teamset" : [
            {"$in" : "es cualquiera de"},
            {"$not_in" : "no es cualquiera de"}
            ],
            "phone" : [
            {"$starts" : "empieza con"},
            {"$equals" : "es"},
            ],
            "radioenum" : [
            {"$equals" : "es"},
            {"$not_equals" : "no es"},
            ],
            "parent" : [
            {"$equals" : "es"},
            ],
            "tag" : [
            {"$in" : "es cualquiera de"},
            {"$not_in" : "no es cualquiera de"},
            {"$empty" : "está vacío"},
            {"$not_empty" : "no está vacío"}
            ],
            "multienum":[
            {"$contains":"es cualquiera de"},
            {"$not_contains" :"no es cualquiera de"}
            ],
            "enum":[ 
            {"$in": "es cualquiera de"},
            {"$not_in": "no es cualquiera de"},
            {"$empty" : "está vacío"},
            {"$not_empty": "no está vacío"}
            ],
            "varchar": [
            {"$equals" : "combinaciones exactas"},
            {"$starts": "empieza con"}
            ],
            "name" : [
            {"$equals" : "combinaciones exactas"},
            {"$starts" : "empieza con"}
            ],    
        }
    },

    /*
    * Obtiene los campos disponibles para filtrar pertenecientes a un módulo en específico 
    */
    getFilterFields: function(moduleName) {
        var moduleMeta = app.metadata.getModule(moduleName),
        fieldMeta = moduleMeta.fields,
        fields = {};
        if (moduleMeta.filters) {
            _.each(moduleMeta.filters, function(templateMeta) {
                if (templateMeta.meta && templateMeta.meta.fields) {
                    fields = _.extend(fields, templateMeta.meta.fields);
                }
            });
        }

        _.each(fields, function(fieldFilterDef, fieldName) {
            var fieldMetaData = app.utils.deepCopy(fieldMeta[fieldName]);
            if (_.isEmpty(fieldFilterDef)) {
                fields[fieldName] = fieldMetaData || {};
            } else {
                fields[fieldName] = _.extend({name: fieldName}, fieldMetaData, fieldFilterDef);
            }
            delete fields[fieldName]['readonly'];
        });

        return fields;
    },

    navigateCuenta:function(evt){

        var idCuenta=$(evt.currentTarget).siblings('input').val();

        app.controller.navigate('Accounts/'+idCuenta);

    },

    openTab:function(evt){
        var pestana=$(evt.currentTarget).text();
        var i, tabcontent, tablinks;
        tabcontent = document.getElementsByClassName("tabcontent");
        $(evt.currentTarget).attr('style','background-color:#ffffff;color:#337ab7;border-left:1px solid #dadada;border-right:1px solid #dadada;border-top:1px solid #dadada;');
        $(evt.currentTarget).siblings().attr('style',"background-color:#ffffff;color:#337ab7;")
        switch(pestana){
            case "Cuenta":
            $('#Cuenta').show();
            $('#Usuario').hide();
                //$('#Analiticos').hide();
                break;

                case "Usuario":
                $('#Usuario').show();
                $('#Cuenta').hide();
                //$('#Analiticos').hide();
                break;

        }//switch
    },

    openViewFilter:function(evt){

        document.getElementById("mySidenav").style.width = "70%";
    },

    closeNav:function(){
        document.getElementById("mySidenav").style.width = "0";
    },

    onChangeFiltro:function(e){

        var campo=$(e.currentTarget).find('option:selected').text();
        var nombre_campo=$(e.currentTarget).val();

        var tipo=this.campos[nombre_campo].type;
        var opciones='';

        for(var i=0;i<this.filterOperatorMap[tipo].length;i++){

            for(var clave in this.filterOperatorMap[tipo][i]){

                var etiqueta_operador=App.lang.get(this.filterOperatorMap[tipo][i][clave],['Accounts','Filters']);
                opciones+="<option value='"+clave+"'>"+etiqueta_operador+"</option>";

            }
        }
        /*
        var etiqueta=$(e.currentTarget).parent().attr('field_label');
        var valor=$(e.currentTarget).parent().attr('field_name');
        */
        var divCampoFiltro='<div style="border: 1px solid #9aa5ad;'+
        'border-radius: 16px;margin:10px" class="'+campo+' '+nombre_campo+' filterSection" field_label="'+campo+'" field_name="'+nombre_campo+'">'+
        '<a href="javascript:void(0)" class="deleteField"">×</a>'+
        '<h4 style="padding-left: 32px;">'+campo+'</h4>'+
        '<div class="field field--enum" style="padding: 8px 8px 8px 32px;width: 70%;">'+
        '<label class="field__label">Operador</label>'+
        '<div class="field__controls">'+
        '<select name="enum" class="operador">'+
        opciones+
        '</select>'+
        '<i class="icondefault icon icon-caret-down selectArrow-icon"></i>'+
        '</div>'+
        '</div>'+
        '</div>';

        $('#filterSection').append(divCampoFiltro);

        $('.operador').trigger('change');

        //Habilitando botón para aplicar filtro
        if($('.deleteField').length>0){

            $('#fireSearch').removeClass('disabled');
            $('#fireSearch').attr('style',"");

        }

        //Eliminando opción elegida para evitar crear un filtro con el mismo campo
        $("#available_fields option[value='"+nombre_campo+"']").remove();

        
    },

    buildFieldByType:function(type,operador,nombre_campo){
        var campo='';

        if(type=='text' || type=='varchar' || type =='name'){

            campo='<div class="field field--onfocus" style="padding: 8px 8px 30px 32px;width: 70%;">'+
            '<label class="field__label">Valor</label>'+
            '<div class="field__controls">'+
            '<span class="input-wrapper">'+
            '<input type="text" autocorrect="off" value="" class="field_value">'+
            '<i class="icondefault icon icon-remove clear-button"></i>'+
            '</span>'+
            '</div>'+
            '</div>';

        }else if(type=='enum'){

            if(operador == '$empty' || operador == '$not_empty'){
                campo='';
            }else{

                //Obteniendo la lista relacionada al campo para establecer los valores en el campo de valor
                var nombre_lista=this.campos[nombre_campo].options;
                var lista=App.lang.getAppListStrings(nombre_lista);
                var strOpciones='';
                for(var key in lista){

                    strOpciones+='<option value="'+key+'">'+lista[key]+'</option>';
                }


                campo='<div class="field field--enum field--onfocus" style="padding: 8px 8px 30px 32px;width: 70%;">'+
                '<label class="field__label">Valor</label>'+
                '<div class="field__controls">'+
                '<select name="enum" class="field_value">'+
                strOpciones+
                '</select>'+
                '<i class="icondefault icon icon-caret-down selectArrow-icon"></i>'+
                '</div>'+
                '</div>';

            }
            
        }else if(operador=='$dateBetween'){

            campo='<div class="field field--date" style="padding: 8px 8px 8px 32px;width: 70%;">'+
            '<label class="field__label">Inicio</label>'+
            '<div class="field__controls field__controls--flex">'+        
            '<input type="date" autocorrect="off" value="" class="empty field_value">'+
            '<div class="btn-group clear-button hide">'+
            '<button class="btn secondary-btn inert"><i class="icondefault icon icon-remove control__btn_remove"></i>'+
            '</button>'+
            '</div>'+
            '</div>'+
            '</div>'+
            '<div class="field field--date" style="padding: 8px 8px 8px 32px;width: 70%;">'+
            '<label class="field__label">Fin</label>'+
            '<div class="field__controls field__controls--flex">'+
            '<input type="date" autocorrect="off" value="" class="empty field_value">'+
            '<div class="btn-group clear-button hide">'+
            '<button class="btn secondary-btn inert"><i class="icondefault icon icon-remove control__btn_remove"></i>'+
            '</button>'+
            '</div>'+
            '</div>'+
            '</div>';

        }else if((type=='date' || type=='datetime') && (operador == '$equals' || operador=='$starts' || operador =='$lt' || operador =='$gt' || operador =='$lte' || operador =='$gte')){

           campo='<div class="field field--date" style="padding: 8px 8px 8px 32px;width: 70%;">'+
           '<label class="field__label">Valor</label>'+
           '<div class="field__controls field__controls--flex">'+
           '<input type="date" autocorrect="off" value="" class="field_value"'+
           'class="empty">'+
           '<div class="btn-group clear-button hide">'+
           '<button class="btn secondary-btn inert"><i class="icondefault icon icon-remove control__btn_remove"></i>'+
           '</button>'+
           '</div>'+
           '</div>'+
           '</div>';
       }

       return campo;

   },

   removerFiltro:function(e){

        //Añadir nuevamente a las opciones disponibles el item removido
        //var etiqueta=$(e.currentTarget).parent()[0].classList[0];
        //var valor=$(e.currentTarget).parent()[0].classList[1];
        var etiqueta=$(e.currentTarget).parent().attr('field_label');
        var valor=$(e.currentTarget).parent().attr('field_name'); 

        $("#available_fields option").eq(0).after($("<option></option>").val(valor).html(etiqueta));
        $(e.currentTarget).parent().remove();

        //Habilitando botón para aplicar filtro
        if($('.deleteField').length>0){
            $('#fireSearch').removeClass('disabled');
            $('#fireSearch').attr('style',"");
        }else{
            self.getCuentas();
            $('#fireSearch').addClass('disabled');
            $('#fireSearch').attr('style',"pointer-events:none");
        }

    },


    setFieldValue:function(e){

        //Obtener el tipo de campo y el operador
        var operador=$(e.currentTarget).val();
        //var nombre_campo=$(e.currentTarget).parent().parent().parent()[0].classList[1];
        var nombre_campo=$(e.currentTarget).parent().parent().parent().attr('field_name');

        var tipo=this.campos[nombre_campo].type;

        var campo=this.buildFieldByType(tipo,operador,nombre_campo);

        //Antes de mostrar el nuevo campo, hay que eliminar el elemento "valor" en caso de que tenga
        //para evitar estar añadiendo elementos "valor" en múltiples ocasiones
        if($(e.currentTarget).parent().parent().next().length>0){
            //$(e.currentTarget).parent().parent().next().remove();
            $(e.currentTarget).parent().parent().siblings('.field').remove();
        }
        $(e.currentTarget).parent().parent().after(campo);

    },

    fireSearch:function(e){
        //Obteniendo cada div para armar el filtro
        var rows=$( ".filterSection" ).length;
        
        var filtro='fields=id,name,account_type,gps_latitud_c,gps_longitud_c,quick_contact_c,business_type_c,'+
        'visit_c,rate_c,photography_c,billing_address_street,billing_address_city,billing_address_state,billing_address_postalcode,billing_address_country,assigned_user_id&max_num=-1';
        var banderaSeguir=true;
        if(rows > 0){
            for (var i = 0; i < rows; i++) {
                var nombre_campo=$('.filterSection').eq(i).attr('field_name');
                var tipo_campo=this.campos[nombre_campo].type;
                var operador=$('.filterSection').eq(i).find('.operador').val();
                var valores=$('.filterSection').eq(i).find('.field_value');
                var valor='';
                var arr_valores=[];
                //Validación para controlar la generación del filtro cuando se tienen más de un valor,
                //p.ej para $dateBetween se necesita fecha inicio y fecha fin
                if(valores.length>1){

                    for (var j = 0; j <valores.length; j++) {
                        arr_valores.push(valores.eq(j).val());
                    }
                    //Condición para establecer bandera y saber si el flujo debe seguir para generar petición hacia api en caso de que no existan campos vacios para generar el filtro 
                    var encontrado=arr_valores.indexOf("");
                    if(encontrado!=-1){
                        banderaSeguir=false;
                    }

                }else{
                    valor=$('.filterSection').eq(i).find('.field_value').val();
                    if(valor==""){
                        banderaSeguir=false;
                    }
                }
                if(valor ==undefined){
                    valor='';
                }

                if(tipo_campo=='enum' && operador != '$not_empty' && operador != '$empty' && operador !='$dateBetween'){
                    filtro+='&filter['+i+']['+nombre_campo+']['+operador+'][]='+valor;
                }else if(arr_valores.length>0){//condición generada únicamente para el filtro de $dateBetween
                    filtro+='&filter['+i+']['+nombre_campo+']['+operador+'][]='+arr_valores[0];
                    filtro+='&filter['+i+']['+nombre_campo+']['+operador+'][]='+arr_valores[1];
                }else{
                        filtro+='&filter['+i+']['+nombre_campo+']['+operador+']='+valor;
                } 
            }

            if(banderaSeguir){
                var self=this;
                var urlFiltro = app.api.buildURL('Accounts?'+filtro,null, null, null);

                app.alert.show('accounts_load', {
                    level: 'load',
                    closeable: false,
                    messages: app.lang.get('LBL_LOADING'),
                });

                app.api.call('GET', urlFiltro, {}, {
                    success: _.bind(function (data) {
                        app.alert.dismiss('accounts_load');
                        self.closeNav();
                        self.defCuentas=data.records;
                        var contextoApiCuentas=this;
                    //Se establece height dinámicamente, con base a la altura de la ventana
                    document.getElementById("map").setAttribute("style", "width: 100%;height: " + window.screen.height+'px');
                    var mapDiv = document.getElementById("map");

                    var map=plugin.google.maps.Map.getMap(mapDiv,{
                        'camera': {
                            'zoom': 7
                        }
                    });

                    //Limpiando mapa para mostrar los nuevos marcadores basados en el filtro
                    map.clear();

                    if(data.records.length>0){

                        //Inicializando infowindow
                        var infowindow = new plugin.google.maps.HtmlInfoWindow();

                        // Add markers
                        var bounds = [];
                        for(var i=0;i<data.records.length;i++){

                            if(data.records[i].gps_latitud_c !="" && data.records[i].gps_longitud_c != ""){

                               var icono='';
                               switch(data.records[i].visit_c){

                                case "Planned":
                                icono = "img/icon-negro_.png";
                                break;

                                case "Done":
                                icono = "img/icon-verde_.png";
                                break;

                                case "Rescheduled":
                                icono = "img/icon-azul_.png";
                                break;
                                case "Canceled":
                                icono = "img/icon-rojo_.png";
                                break;
                                case "Pending":
                                icono = "img/icon-amarillo_.png";
                                break;

                                case "":
                                icono = "img/icon-negro_.png";
                                break;

                                default:
                                icono = "img/icon-negro_.png";
                                }//switch
                                
                                bounds.push({"lat":data.records[i].gps_latitud_c,"lng":data.records[i].gps_longitud_c});

                                var marker = map.addMarker({
                                    'position': {"lat":data.records[i].gps_latitud_c,"lng":data.records[i].gps_longitud_c},
                                    'title': data.records[i].id,
                                    'icon': {
                                        'url': icono
                                    }
                                });

                                marker.on(plugin.google.maps.event.INFO_CLICK, function() {
                                    // Hide the infoWindow
                                    marker.hideInfoWindow();
                                });

                                marker.on(plugin.google.maps.event.MARKER_CLICK, function(markers, info) {

                                    document.getElementById("map").setAttribute("style", "width: 100%;height: " + window.screen.height+'px');
                                    var idCuenta=info.getOptions().title;
                                    var definicionCuenta=self.search(idCuenta, self.defCuentas);
                                    var urlImage='';
                                    if(definicionCuenta.photography_c != "" && definicionCuenta.photography_c !=null){
                                        urlImage=self.generarURLImage('Accounts', definicionCuenta.id, 'photography_c',definicionCuenta.photography_c);

                                    }else{
                                        urlImage='img/sugar_crm_icon.png';
                                    }

                                    var domicilio='';
                                    if(definicionCuenta.calle != null && definicionCuenta.calle != "" && definicionCuenta.calle !=undefined &&
                                        definicionCuenta.ciudad !=null && definicionCuenta.ciudad != "" && definicionCuenta.ciudad !=undefined){
                                        domicilio='<b> '+definicionCuenta.calle+', '+definicionCuenta.ciudad+'<br>'+
                                    definicionCuenta.estado+' ' +definicionCuenta.cp +'<br>'+
                                    definicionCuenta.pais+'</b>';
                                }
                                var contenido='<p>Nombre del negocio: <input type = "hidden" value="'+definicionCuenta.id+'"><font id="linkCuenta" color="#0679c8">'+definicionCuenta.name+'</font></p>'+
                                '<p>Contacto rápido: <b> '+definicionCuenta.quick_contact_c+'</b></p>'+
                                '<p>Tipo de negocio: <b> '+App.lang.getAppListStrings('business_type_list')[definicionCuenta.business_type_c]+'</b></p>'+
                                '<p>Tipo: <b> '+App.lang.getAppListStrings('account_type_dom')[definicionCuenta.account_type]+'</b></p>'+
                                '<p>Domicilio: '+domicilio+'</p>';

                                    //$('#nameStars').children('div').eq(0).html('<h1>'+definicionCuenta.name+'<h1>');

                                    var contenidoUsuario='<p>Usuario: <a href="#Users/'+definicionCuenta.id_user+' "target="_blank">'+definicionCuenta.nombre_completo_usuario +'</a></p>'+
                                    '<p>Nombre de Usuario: <b>'+definicionCuenta.nombre_usuario +'</b></p>'+
                                    '<p>Departamento: <b>'+definicionCuenta.depto +'</b></p>'+
                                    '<p>Informa a: <a href="#Users/'+definicionCuenta.reporta_id+' "target="_blank">'+definicionCuenta.reporta +'</a></p>';

                                    //Llenando sección con las estrellas
                                    var estrellas=definicionCuenta.rate_c;
                                    var contenidoEstrellas='';
                                    if(estrellas=="" || estrellas ==0 || estrellas ==null){
                                        contenidoEstrellas='<img style="" src="img/0_estrellas.png" width="100">';
                                        //$('#star_container').html(contenidoEstrellas);
                                    }else{

                                        contenidoEstrellas='<img style="" src="img/'+estrellas+'_estrellas.png" width="100">';

                                        //$('#star_container').html(contenidoEstrellas);
                                    }

                                    var contenidoInfoWindow='<div class="tab" style="width: 330px;border-bottom: 1px solid #ddd">'+
                                    '<button class="tablinks" style="background-color:#ffffff;color:#337ab7;border-left:1px solid #dadada;border-right:1px solid #dadada;border-top:1px solid #dadada;">Cuenta</button>'+
                                    '<button class="tablinks" style="background-color:#ffffff;color:#337ab7;">Usuario</button>'+
                                    '</div>'+
                                    '<div id="Cuenta" class="tabcontent">'+
                                    '<div id="contenidoCuenta" style="padding: 10px;">'+
                                    '<img style="float: left; margin: 0px 15px 15px 0px;" src="'+urlImage+'" width="100">'+
                                    '<p> Nombre del negocio: <a href="#Accounts/'+definicionCuenta.id+'"target="_blank"> '+definicionCuenta.name+'</a></p>'+
                                    contenidoEstrellas+
                                    '<p>Contacto rápido: <b> '+definicionCuenta.quick_contact_c+'</b></p>'+
                                    '<p>Tipo de negocio: <b> '+App.lang.getAppListStrings('business_type_list')[definicionCuenta.business_type_c]+'</b></p>'+
                                    '<p>Tipo: <b> '+App.lang.getAppListStrings('account_type_dom')[definicionCuenta.account_type]+'</b></p>'+
                                    '<p>Domicilio:'+domicilio+'</p>'+            
                                    '</div>'+
                                    '</div>'+
                                    '<div id="Usuario" class="tabcontent" style="display:none">'+
                                    '<div id="contenidoUsuario" style="padding: 10px;">'+
                                    '<p>Usuario: <a href="#Users/'+definicionCuenta.id_user+' "target="_blank">'+definicionCuenta.nombre_completo_usuario +'</a></p>'+
                                    '<p>Nombre de Usuario: <b>'+definicionCuenta.nombre_usuario +'</b></p>'+
                                    '<p>Departamento: <b>'+definicionCuenta.depto +'</b></p>'+
                                    '<p>Informa a: <a href="#Users/'+definicionCuenta.reporta_id+'" target="_blank">'+definicionCuenta.reporta +'</a></p>'+
                                    '</div>'+
                                    '</div>';

                                    infowindow.setContent(contenidoInfoWindow);
                                    infowindow.open(this);

                                });
                            }//if lat lng
                        }//for

                        // Set a camera position that includes all markers.
                        map.moveCamera({
                            target: bounds
                        });
                    }//if length data.records
                },self),
            });

            }//Fin banderaSeguir
            else{

                app.alert.show('message-id', {
                    level: 'error',
                    messages: 'Falta información para filtrar',
                    autoClose: false
                });

            }
        }//Fin if rows
    },//Fin fireSearch

    search:function(key,defCuentas){
        for(var i=0;i<defCuentas.length;i++){
            if(defCuentas[i].id===key){
                return defCuentas[i];
            }
        }
    },

    generarURLImage : function (module, id, field,_hash) {
        var url = app.api.buildFileURL({
            module : module,
            id : id,
            field : field 
        }) + "&_hash=" + _hash;
        return url;
    },  

    onAfterRender(){
        document.getElementById("map").setAttribute("style", "width: 100%;height: " + window.screen.height+'px');
        var mapDiv = document.getElementById("map");

        // Initialize the map plugin
        var map = plugin.google.maps.Map.getMap(mapDiv);

        // You have to wait the MAP_READY event.
        map.one(plugin.google.maps.event.MAP_READY, this.onMapInit);
    },

    onMapInit(map) {

        // Add a marker
        /*
        map.addMarker({
            'position': {"lat": 19.4326018, "lng": -99.13320490000001},
            'title': "MARKER ESTATICO!"
        }, function(marker) {
            // Show the infoWindow
            marker.showInfoWindow();
        });
        */

    }
});

module.exports = LocationsView;
