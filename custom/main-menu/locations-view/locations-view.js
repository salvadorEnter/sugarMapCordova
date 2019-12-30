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
            if(this.campos[key].type != undefined){
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

                                    //$('#section_info').show();
                                    //$('#section_info').html(contenido);

                                    //$('#contenidoUsuario').html(contenidoUsuario);
                                    // var urlImage=self.generarURLImage('Accounts', definicionCuenta.id, 'photography_c',definicionCuenta.photography_c);
                                    //$('#imageSection').html('<img style="float: left; margin: 0px 15px 15px 0px;" src="'+urlImage+'" width="40%">');
                                    //$('#imageSection').html('<img style="float: left; margin: 0px 15px 15px 0px;" src="img/defaultImageMap.png" width="40%">');
                                    /*
                                    var contenidoInfoWindow='<div class="container" style="width:300px; height:300px;">'+
                                            '<ul class="nav nav-tabs">'+
                                                '<li class="active">'+
                                                    '<a data-toggle="tab" href="#menu1">'+
                                                        'Información de Cuenta'+
                                                    '</a>'+
                                                '</li>'+
                                                '<li>'+
                                                    '<a data-toggle="tab" href="#menu2">'+
                                                        'Usuario'+
                                                    '</a>'+
                                                '</li>'+
                                            '</ul>'+
                                            '<div class="tab-content">'+
                                                '<div id="menu1" class="tab-pane fade in active">'+
                                                    '<img style="float: left; margin: 0px 15px 15px 0px;" src="'+urlImageIw+'" width="100">'+
                                                    '<p> Nombre del negocio: <a href="#Accounts/'+definicionCuenta.id+'"target="_blank"> '+definicionCuenta.name+'</a></p>'+
                                                    '<p>Contacto rápido: <b> '+definicionCuenta.quick_contact_c+'</b></p>'+
                                                    '<p>Tipo de negocio: <b> '+App.lang.getAppListStrings('business_type_list')[definicionCuenta.business_type_c]+'</b></p>'+
                                                    '<p>Tipo: <b> '+App.lang.getAppListStrings('account_type_dom')[definicionCuenta.account_type]+'</b></p>'+
                                                    '<p>Domicilio:'+domicilio+'</p>'+
                                                '</div>'+
                                                '<div id="menu2" class="tab-pane fade">'+
                                                    '<p>Usuario: <a href="#Users/'+definicionCuenta.id_user+' "target="_blank">'+definicionCuenta.nombre_completo_usuario +'</a></p>'+
                                                    '<p>Nombre de Usuario: <b>'+definicionCuenta.nombre_usuario +'</b></p>'+
                                                    '<p>Departamento: <b>'+definicionCuenta.depto +'</b></p>'+
                                                    '<p>Informa a: <a href="#Users/'+definicionCuenta.reporta_id+'" target="_blank">'+definicionCuenta.reporta +'</a></p>'+
                                                '</div>'+
                                            '</div>'+
                                        '</div>';
                                        */
                                        
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
        
        /*
        tablinks = document.getElementsByClassName("tablinks");
        for (i = 0; i < tablinks.length; i++) {
            tablinks[i].className = tablinks[i].className.replace(" active", "");
        }
        document.getElementById(pestana).style.display = "block";
        evt.currentTarget.className += " active";
        */

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

        var divCampoFiltro='<div style="border: 1px solid #9aa5ad;'+
  'border-radius: 16px;margin:10px" class="'+campo+' '+nombre_campo+'">'+
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

        //Eliminando opción elegida para evitar crear un filtro con el mismo campo
        $("#available_fields option[value='"+nombre_campo+"']").remove();

        
    },

    buildFieldByType:function(type,operador){
        var campo='';

        if(type=='text' || type=='varchar' || type =='name'){

            campo='<div class="field field--onfocus" style="padding: 8px 8px 30px 32px;width: 70%;">'+
    '<label class="field__label">Valor</label>'+
    '<div class="field__controls">'+
        '<span class="input-wrapper">'+
            '<input type="text" autocorrect="off" value="">'+
            '<i class="icondefault icon icon-remove clear-button"></i>'+
        '</span>'+
    '</div>'+
'</div>';

        }else if(type=='enum'){

            campo='<div class="field field--enum field--onfocus" style="padding: 8px 8px 30px 32px;width: 70%;">'+
    '<label class="field__label">Valor</label>'+
    '<div class="field__controls">'+
        '<select name="enum">'+
                '<option value="" selected=""></option>'+
                '<option value="Draft">Draft</option>'+
                '<option value="Negotiation">Negotiation</option>'+
                '<option value="Delivered">Delivered</option>'+
        '</select>'+
        '<i class="icondefault icon icon-caret-down selectArrow-icon"></i>'+
    '</div>'+
'</div>';
        }else if(operador=='$dateBetween'){

            campo='<div class="field field--date" style="padding: 8px 8px 8px 32px;width: 70%;">'+
    '<label class="field__label">Inicio</label>'+
    '<div class="field__controls field__controls--flex">'+
        '<span class="input-wrapper">'+
            '<input type="date" autocorrect="off" value="" class="empty">'+
        '</span>'+
        '<div class="btn-group clear-button hide">'+
            '<button class="btn secondary-btn inert"><i class="icondefault icon icon-remove control__btn_remove"></i>'+
'</button>'+
        '</div>'+
    '</div>'+
'</div>'+
'<div class="field field--date" style="padding: 8px 8px 8px 32px;width: 70%;">'+
    '<label class="field__label">Fin</label>'+
    '<div class="field__controls field__controls--flex">'+
        '<span class="input-wrapper">'+
            '<input type="date" autocorrect="off" value="" class="empty">'+
        '</span>'+
        '<div class="btn-group clear-button hide">'+
            '<button class="btn secondary-btn inert"><i class="icondefault icon icon-remove control__btn_remove"></i>'+
'</button>'+
        '</div>'+
    '</div>'+
'</div>';

        }else if(type=='date' || type=='datetime'){

             campo='<div class="field field--date" style="padding: 8px 8px 8px 32px;width: 70%;">'+
    '<label class="field__label">Valor</label>'+
    '<div class="field__controls field__controls--flex">'+
        '<span class="input-wrapper">'+
            '<input type="date" autocorrect="off" value=""'+
                'class="empty">'+
        '</span>'+
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
        var etiqueta=$(e.currentTarget).parent()[0].classList[0];
        var valor=$(e.currentTarget).parent()[0].classList[1];

        $("#available_fields option").eq(0).after($("<option></option>").val(valor).html(etiqueta));
        $(e.currentTarget).parent().remove();

    },


    setFieldValue:function(e){

        //Obtener el tipo de campo y el operador
        var operador=$(e.currentTarget).val();
        var nombre_campo=$(e.currentTarget).parent().parent().parent()[0].classList[1];

        var tipo=this.campos[nombre_campo].type;

        var campo=this.buildFieldByType(tipo,operador);

        $(e.currentTarget).parent().parent().after(campo);

    },

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
